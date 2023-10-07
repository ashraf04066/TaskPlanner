import { React } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import TaskService from "../services/TaskService";
import { useMutation } from "react-query";
import { queryClient } from "../App";
import useServerMessageToast from "../hooks/useServerMessageToast";

const TaskCreateModal = ({ show, onHide, onSave, currTask }) => {
  const [toast, showServerMessageToast] = useServerMessageToast();

  // Updates the chore
  const updateTaskMutation = useMutation(
    (variables) =>
      TaskService.updateTask(
        variables.id,
        variables.name,
        variables.freqQuantity,
        variables.freqTimePeriod,
        variables.location,
        variables.duration,
        variables.preference
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("chores");
        onSave();
        handleClose();
      },
      onError: (error) => {
        showServerMessageToast(error.response.data.message, "error");
      },
    }
  );

  // Creates the chore
  const createTaskMutation = useMutation(
    (variables) =>
      TaskService.createTask(
        variables.name,
        variables.freqQuantity,
        variables.freqTimePeriod,
        variables.location,
        variables.duration,
        variables.preference
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("chores");
        onSave();
        handleClose();
      },
      onError: (error) => {
        showServerMessageToast(error.response.data.message, "error");
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      choreName: "",
      frequencyQuantity: null,
      frequencyTimePeriod: "",
      location: "",
      durationQuantity: null,
      durationTimePeriod: "",
      preference: "",
    },
    validate: (values) => {
      const errors = {};
      if (values.choreName === "") {
        errors.choreName = "Task name is required.";
      }

      if (
        values.frequencyQuantity === null ||
        values.frequencyTimePeriod === ""
      ) {
        errors.frequencyQuantity = "Task frequency is required.";
        errors.frequencyTimePeriod = "Task frequency is required.";
      } else if (values.frequencyQuantity === 0) {
        errors.frequencyQuantity = "Task frequency cannot be 0.";
      }

      if (
        values.durationQuantity === null ||
        values.durationTimePeriod === ""
      ) {
        errors.durationQuantity = "Task duration is required.";
        errors.durationTimePeriod = "Task duration is required.";
      } else if (values.durationQuantity === 0) {
        errors.durationQuantity = "Task duration cannot be 0.";
      }

      if (values.preference === "") {
        errors.preference = "Task preference is required.";
      }

      return errors;
    },
    onSubmit: (values) => {
      const choreName = values.choreName;
      const freqQuantity = values.frequencyQuantity;
      const freqTimePeriod = values.frequencyTimePeriod;
      const location = values.location;
      const durQuantity = values.durationQuantity;
      const durTimePeriod = values.durationTimePeriod;
      const preference = values.preference;

      const MIN_TO_SEC = 60;
      const HOUR_TO_SEC = 3600;
      var dur;
      if (durTimePeriod === durations[0]) {
        dur = durQuantity * MIN_TO_SEC;
      } else if (durTimePeriod === durations[1]) {
        dur = durQuantity * HOUR_TO_SEC;
      }
      const duration = dur;

      if (currTask != null && currTask._id !== -1) {
        updateTaskMutation.mutate({
          id: currTask._id,
          name: choreName,
          freqQuantity,
          freqTimePeriod,
          location,
          duration,
          preference,
        });
      } else {
        createTaskMutation.mutate({
          name: choreName,
          freqQuantity,
          freqTimePeriod,
          location,
          duration,
          preference,
        });
      }
    },
    validateOnBlur: true,
    validateOnChange: true,
  });

  const handleClose = () => {
    formik.resetForm();
    onHide();
  };

  const frequencies = [
    { name: "Days", val: "days" },
    { name: "Weeks", val: "weeks" },
    { name: "Months", val: "months" },
    { name: "Years", val: "years" },
  ];

  const durations = ["Minutes", "Hours"];

  const preferences = [
    { name: "Low", val: "low" },
    { name: "Medium", val: "medium" },
    { name: "High", val: "high" },
  ];

  const handlePopulation = () => {
    const MIN_TO_SEC = 60;
    const HOUR_TO_SEC = 3600;

    if (currTask != null && currTask._id !== -1) {
      let durQuantity =
        currTask.duration < HOUR_TO_SEC
          ? currTask.duration / MIN_TO_SEC
          : currTask.duration / HOUR_TO_SEC;
      let durInterval = currTask.duration < HOUR_TO_SEC ? "Minutes" : "Hours";

      formik.setFieldValue("choreName", currTask.name, false);
      formik.setFieldValue(
        "frequencyQuantity",
        currTask.frequency.quantity,
        false
      );
      formik.setFieldValue(
        "frequencyTimePeriod",
        currTask.frequency.interval,
        false
      );
      formik.setFieldValue("location", currTask.location, false);
      formik.setFieldValue("durationQuantity", durQuantity, false);
      formik.setFieldValue("durationTimePeriod", durInterval, false);
      formik.setFieldValue("preference", currTask.preference, false);
    }
  };

  const footerContent = (
    <>
      <Button type="button" id="cancelButton" onClick={() => handleClose()}>
        Cancel
      </Button>
      <Button onClick={formik.handleSubmit}>Save</Button>
    </>
  );

  return (
    <div>
      <Toast ref={toast} />
      <Dialog
        visible={show}
        header={
          currTask == null || currTask._id === -1
            ? "Create Task"
            : "Edit Task"
        }
        style={{ width: "50vw" }}
        onShow={handlePopulation}
        onHide={handleClose}
        footer={footerContent}
        maximizable
      >
        <form>
          <div>
            <label htmlFor="choreName">Name</label>
            <InputText
              type="text"
              id="choreName"
              name="choreName"
              className={classNames({
                "user-form-text-input": true,
                "p-invalid": formik.errors.choreName,
              })}
              value={formik.values.choreName}
              onChange={formik.handleChange}
            />

            {formik.errors.choreName && (
              <small className="p-error field-validation-note">
                {formik.errors.choreName}
              </small>
            )}
          </div>

          <fieldset>
            <legend>Frequency</legend>

            <InputNumber
              id="frequencyQuantity"
              name="frequencyQuantity"
              useGrouping={false}
              className={classNames({
                "user-form-text-input": true,
                "p-invalid": formik.errors.frequencyQuantity,
              })}
              value={formik.values.frequencyQuantity}
              onValueChange={(e) => {
                formik.setFieldValue("frequencyQuantity", e.value);
              }}
            />

            <Dropdown
              name="frequencyTimePeriod"
              options={frequencies}
              optionLabel="name"
              optionValue="val"
              placeholder="Select"
              className={classNames({
                "user-form-text-input": true,
                "p-invalid": formik.errors.frequencyTimePeriod,
              })}
              value={formik.values.frequencyTimePeriod}
              onChange={(e) => {
                formik.setFieldValue("frequencyTimePeriod", e.value);
              }}
            />

            {formik.errors.frequencyQuantity && (
              <small className="p-error field-validation-note">
                {formik.errors.frequencyQuantity}
              </small>
            )}
          </fieldset>

          <div>
            <label htmlFor="location">Location</label>
            <InputText
              type="text"
              id="location"
              name="location"
              value={formik.values.location}
              onChange={formik.handleChange}
            />
          </div>

          <fieldset>
            <legend>Duration</legend>

            <InputNumber
              id="durationQuantity"
              name="durationQuantity"
              useGrouping={false}
              minFractionDigits={0}
              maxFractionDigits={2}
              className={classNames({
                "user-form-text-input": true,
                "p-invalid": formik.errors.durationQuantity,
              })}
              value={formik.values.durationQuantity}
              onValueChange={(e) => {
                formik.setFieldValue("durationQuantity", e.value);
              }}
            />

            <Dropdown
              name="durationTimePeriod"
              options={durations}
              placeholder="Select"
              className={classNames({
                "user-form-text-input": true,
                "p-invalid": formik.errors.durationTimePeriod,
              })}
              value={formik.values.durationTimePeriod}
              onChange={(e) => {
                formik.setFieldValue("durationTimePeriod", e.value);
              }}
            />

            {formik.errors.durationQuantity && (
              <small className="p-error field-validation-note">
                {formik.errors.durationQuantity}
              </small>
            )}
          </fieldset>

          <div>
            <label htmlFor="preference">Preference</label>
            <Dropdown
              id="preference"
              name="preference"
              options={preferences}
              optionLabel="name"
              optionValue="val"
              placeholder="Select"
              className={classNames({
                "user-form-text-input": true,
                "p-invalid": formik.errors.preference,
              })}
              value={formik.values.preference}
              onChange={(e) => {
                formik.setFieldValue("preference", e.value);
              }}
            />

            {formik.errors.preference && (
              <small className="p-error field-validation-note">
                {formik.errors.preference}
              </small>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default TaskCreateModal;
