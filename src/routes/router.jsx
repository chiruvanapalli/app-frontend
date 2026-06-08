import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import About from "../pages/About";

export const router = createBrowserRouter([
{
    path:"/",
    element: <Home />
},
{
    path:"/about",
    element: <About />
},
{
    path:"/dashboard",
    element: <Dashboard />
}
])