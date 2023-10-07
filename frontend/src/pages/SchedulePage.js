import { React } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import ScheduleList from "../components/ScheduleList";

// Renders the schedule page
const SchedulePage = ({ isTasksLoading, choresData }) => {
  return (
    <>
      <div className="content">
        {isTasksLoading ? (
          <ProgressSpinner />
        ) : (
          <ScheduleList chores={choresData.data} />
        )}
      </div>
    </>
  );
};

export default SchedulePage;
