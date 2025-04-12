import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginFields } from "../config/config/constants";
import FormAction from "./FormAction";
import FormExtra from "./FormExtra";
import Input from "./Input";
import { setToken } from "../config/config/helpers";
import { toastNotify } from "./Toast";
import state from "../store";

const fields = loginFields; //Importing static fields from config/helpers.
let fieldsState = {};
fields.forEach((field) => (fieldsState[field.id] = ""));

export default function Login() {
  const navigate = useNavigate(); //usage of navigation function from react-router-dom.

  const [loginState, setLoginState] = useState(fieldsState);

  const handleChange = (e) => {
    setLoginState({ ...loginState, [e.target.id]: e.target.value }); // his updates the static state of login page fields.
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    authenticateUser(); // on submit we trigger this function for authentication where the api call will be done.
  };

  //Handle Login API Integration here
  async function authenticateUser() {
    // this function can be converted to async function when we integrate API for authentication and additional error boundaries can be set.

    setToken("asdajsdjajsdhaksjdh"); // bypass
    state.intro = true; //setting the home page display to true.
    navigate("/home"); // along with updating the state we are navigating to '/'.
    toastNotify("Logged In Successfully!", "success"); //displaying the notification for logged in.
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="-space-y-px">
        {fields.map((field) => (
          <Input
            key={field.id}
            handleChange={handleChange}
            value={loginState[field.id]}
            labelText={field.labelText}
            labelFor={field.labelFor}
            id={field.id}
            name={field.name}
            type={field.type}
            isRequired={field.isRequired}
            placeholder={field.placeholder}
          />
        ))}
      </div>

      <FormExtra />
      <FormAction handleSubmit={handleSubmit} text="Login" />
    </form>
  );
}
