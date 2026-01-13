// FormAction.jsx
import PropTypes from "prop-types";

export default function FormAction({ text, disabled }) {
  return (
    <button
      type="submit"   // 🔥 ALWAYS submit
      disabled={disabled}
      className="group relative w-full flex justify-center py-2 px-4
                 text-sm font-medium rounded-md text-white
                 bg-gray-500 hover:bg-yellow-600
                 focus:outline-none focus:ring-2 focus:ring-offset-2
                 mt-10 disabled:opacity-60"
    >
      {text}
    </button>
  );
}

FormAction.propTypes = {
  type: PropTypes.string,
  action: PropTypes.string,
  text: PropTypes.string,
  disabled: PropTypes.bool,
};
