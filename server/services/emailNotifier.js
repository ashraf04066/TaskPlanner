const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const dotenv = require("dotenv");
const User = require("../models/User");
const Task = require("../models/Task");
const { repeatInMs } = require("./utils");

dotenv.config();

/*
 ** This function gets the current day
 ** and returns a time in Unix timestamp formatted to 12am
 */
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toUTCFormat(today);
};

/*
 ** This function formats a date to 12am at the start of that day
 ** @params date, date in UTC format
 */
const toUTCFormat = (date) => {
  const millisecondsPerDay = 86400000;
  const unixEpochMilliseconds = 0;
  return (
    Math.floor((date * 1000) / millisecondsPerDay) * millisecondsPerDay +
    unixEpochMilliseconds
  );
};

/*
 ** This function gets the chores for that need to be emailed to a user
 ** @params user,  a user object
 ** It returns an object that contains the chores the user needs to do today, and the overdue chores the user has
 */
module.exports.getTasksForUser = async (user) => {
  const today = getToday();
  const chores = await Task.find({
    _id: { $in: user.chores },
    nextOccurrence: { $exists: true },
  });

  // get the chores for today
  const todaysTasks = chores
    .filter((chore) => {
      const timeframeIndays = repeatInMs(
        chore.frequency.quantity,
        chore.frequency.interval
      );
      const nextOccurrence = toUTCFormat(chore.nextOccurrence);

      return (today - nextOccurrence) % timeframeIndays === 0;
    })
    .map((chore) => {
      return {
        Task: chore.name,
        Location: chore.location,
        "Duration(minutes)": chore.duration / 60,
      };
    });

  // get all over due chores
  // over due chores would have a timestamp older than today's date
  const overdueTasks = chores
    .filter((chore) => {
      const nextOccurrence = toUTCFormat(chore.nextOccurrence);

      return nextOccurrence < today;
    })
    .map((chore) => {
      return {
        Task: chore.name,
        Location: chore.location,
        "Duration(minutes)": chore.duration / 60,
        From: new Date(chore.nextOccurrence).toLocaleDateString(),
      };
    });

  return { todaysTasks, overdueTasks };
};

/*
 ** This function sends emails to all the users that are subscribed to notifications
 */
module.exports.startEmailService = async () => {
  const config = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  };
  const transporter = nodemailer.createTransport(config);
  const MailGenerator = new Mailgen({
    theme: "cerberus",
    product: {
      name: "Taskplanner",
      link: process.env.FRONTEND,
    },
  });

  try {
    const users = await User.find({});

    for (const user of users) {
      //skip users that don't want notifications
      if (!user.receiveNotifs) {
        continue;
      }
      const { todaysTasks, overdueTasks } =
        await module.exports.getTasksForUser(user);
      const intro =
        todaysTasks.length === 0 && overdueTasks.length === 0
          ? "You have no chores to do today!"
          : "Here are your chores for today!";
      const response = {
        body: {
          greeting: "Hello",
          name: "",
          intro,
          table: [
            {
              title: todaysTasks.length !== 0 ? "Today's Tasks" : undefined,
              data: [...todaysTasks],
            },
            {
              title: overdueTasks.length !== 0 ? "Overdue Tasks" : undefined,
              data: [...overdueTasks],
            },
          ],
          action: {
            instructions:
              todaysTasks.length !== 0
                ? "To get started, please click here:"
                : "Click here to create new chores",
            button: {
              color: "#313131", // Optional action button color
              text: "Open TaskPlanner",
              link: process.env.FRONTEND, // frontend link
            },
          },
          outro:
            "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
      };
      //build email
      let mail = MailGenerator.generate(response);
      let message = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Your Tasks For Today",
        html: mail,
      };

      //send mail
      try {
        await transporter.sendMail(message);
      } catch (error) {
        console.log("An error occured while sending the e-mails");
        console.error(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
