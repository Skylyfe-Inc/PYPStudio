import { Link } from "react-router-dom";
import PropTypes from "prop-types";

// header component for login and signup pages
export default function Header({
  heading,
  paragraph,
  linkName,
  linkUrl = "#",
}) {
  return (
    <div className="mb-10">
      <div className="flex justify-center">
        <img
          alt=""
          className="h-60 w-60S"
          src="https://www.placeyourprintontheworld.com/cdn/shop/files/PYPOTWBlack_31c54875-93d4-41b2-b7ea-e8d44ce79015.png?v=1707316176&width=600"
        />
      </div>
      {/* or we can add a title here instead of image */}
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {heading}
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600 mt-5">
        {paragraph}{" "}
        <Link
          to={linkUrl}
          className="font-medium text-yellow-0 hover:text-yellow-500"
        >
          {linkName}
        </Link>
      </p>
    </div>
  );
}

// Type declaration for agrs.

Header.propTypes = {
  name: PropTypes.string,
  heading: PropTypes.string,
  paragraph: PropTypes.string,
  linkName: PropTypes.string,
  linkUrl: PropTypes.string,
};
