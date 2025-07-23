import { useState } from "react";
import { signupFields } from "../config/config/constants";
import FormAction from "./FormAction";
import Input from "./Input";
import { useNavigate } from "react-router-dom";
import { toastNotify } from "./Toast";
import config from "../config/config/config";

const fields = signupFields;
let fieldsState = {};

fields.forEach((field) => (fieldsState[field.id] = ""));

export default function Signup() {
  const navigate = useNavigate();
  const [signupState, setSignupState] = useState(fieldsState);

  const handleChange = (e) =>
    setSignupState({ ...signupState, [e.target.id]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAccount();
  };

  //handle Signup API Integration here
  const createAccount = async () => {
    try {
      const response = await fetch(`${config.authService}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: signupState["email-address"],
          password: signupState.password,
          username: signupState.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Signup failed");
      }

      toastNotify("Account created successfully!", "success");
      navigate("/login");
    } catch (error) {
      toastNotify(error.message || "Error signing up", "error");
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="">
        {fields.map((field) => (
          <Input
            key={field.id}
            handleChange={handleChange}
            value={signupState[field.id]}
            labelText={field.labelText}
            labelFor={field.labelFor}
            id={field.id}
            name={field.name}
            type={field.type}
            isRequired={field.isRequired}
            placeholder={field.placeholder}
          />
        ))}
        <FormAction handleSubmit={handleSubmit} text="Signup" />
      </div>
    </form>
  );
}
