// app/operator/layout.js
import { RegisterProvider } from "../../context/RegisterContext";

export default function OperatorLayout({ children }) {
  return (
    <RegisterProvider>
      {children}
    </RegisterProvider>
  );
}
