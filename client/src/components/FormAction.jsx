import PropTypes from "prop-types";

// Creating a button for specific form component with handling event as well as dynamic class name.
export default function FormAction({
  handleSubmit,
  type = "Button",
  action = "submit",
  text,
}) {
  return (
    <>
      {type === "Button" ? (
        <button
          type={action}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mt-10"
          onSubmit={handleSubmit}
        >
          {text}
        </button>
      ) : (
        <></>
      )}
    </>
  );
}

// Declaring the types of args passed in components.

FormAction.propTypes = {
  handleSubmit: PropTypes.func,
  type: PropTypes.string,
  action: PropTypes.string,
  text: PropTypes.string,
};
