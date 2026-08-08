import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import BotBuilder from "./pages/BotBuilder";
import Templates from "./pages/Templates";
import Contacts from "./pages/Contacts";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/conversations/:id" element={<Conversations />} />
          <Route path="/bot-builder" element={<BotBuilder />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
