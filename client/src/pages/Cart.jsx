import  { useState } from 'react';

import {
  
  CustomButton,
} from "../components/index.js";
import hoodiePlaceholder from '../assets/assets/3d-hoodie-icon.png';
import logoPlaceholder from '../assets/assets/gotbLogo.png';
const Cart = () => {
      const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => setQuantity(quantity + 1);
  const handleDecrease = () => quantity > 1 && setQuantity(quantity - 1);
  const handleCheckOutNavigation = () => {
    state.intro = true;
    navigate("/cart");
  };
  const handleNewDesign = () => {
    state.intro = true;
    navigate("/cart");
  };
 return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex gap-4 border-b pb-4">
        <img src={hoodiePlaceholder} alt="Custom Shirt" className="w-32 h-32 object-cover" />
        <div className="flex-1">
          <h2 className="text-lg font-bold">Custom Shirt</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-4 h-4 rounded-full bg-purple-700 border"></div>
            <span className="text-sm text-gray-600">Color</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            
          <div className="flex items-center gap-2 mt-2">
  <CustomButton
   handleClick={handleDecrease}
    type="outline"
    customStyles={quantity === 1 ? 'opacity-50 cursor-not-allowed' : ''}
  >
    -
  </CustomButton>
  <span className="min-w-[20px] text-center">{quantity}</span>
  <CustomButton
    handleClick={handleIncrease}
    type="outline"
  >
    +
  </CustomButton>
</div>

          </div>
          <a href="#" className="text-sm text-purple-700 mt-2 inline-block">Continue customizing</a>
        </div>
        <div className="text-right">
          <button className="text-sm text-red-600">Remove all</button>
          <p className="text-lg font-bold mt-2">$44.99</p>
          <a href="#" className="text-sm text-purple-700">Save for later</a><br />
          <a href="#" className="text-sm text-red-600">Remove</a>
        </div>
      </div>

      <div className="flex justify-between items-start mt-6">
        <div>
          <h3 className="font-bold">Select Vendor</h3>
          <p className="italic">Hanes</p>
          <img src={logoPlaceholder} alt="Hanes Logo" className="w-24 mt-2" />
          <a href="#" className="text-sm text-purple-700 block mt-1">Visit Vendor Profile</a>
          <CustomButton className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">Select</CustomButton>
        </div>

        <div className="text-right">
          <p className="font-bold">Sub-Total</p>
          <p className="text-sm italic">1 item</p>
          <p className="text-2xl font-bold mt-1">$44.99</p>

          <div className="mt-4 space-y-2">
 <CustomButton
  type="filled"
  title="Checkout"
  handleAddCartClick={() => console.log("Checkout")}
  handleClick={handleCheckOutNavigation}
  customStyles="rounded-full border border-black w-full font-bold text-sm mt-2"
/>

<CustomButton
  type="black"
  title="New Design"
  handleAddCartClick={() => console.log("New Design")}
  handleClick={handleNewDesign}
  customStyles="rounded-full border border-black w-full font-bold text-sm mt-2"
/>

</div>

        </div>
      </div>
    </div>
  );
};

export default Cart;