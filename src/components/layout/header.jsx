import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useFormStore } from "@/lib/store";
import logo from "@/assets/images/ChatGPT_Image_Feb_12__2026__12_32_18_PM__1_-removebg-preview.png";
import LeaveConfirmationDialog from "./LeaveConfirmationDialog";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleHomeNavigation } = useFormStore();

  const handleHomeClick = (e) => {
    if (location.pathname !== "/") {
      e.preventDefault();
      handleHomeNavigation(() => {
        navigate("/");
      });
    }
  };

  return (
    <>
      <header className="bg-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link
            to="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2"
          >
            <img src={logo} alt="QuickHomeFix" className="w-20 h-20 object-contain" />
          </Link>
        </div>
      </header>

      <LeaveConfirmationDialog onConfirm={() => navigate("/")} />
    </>
  );
}

export default Header;
