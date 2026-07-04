import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import NewGrid from "./pages/NewGrid";
import ViewerPage from "./pages/ViewerPage";
import EditorPage from "./pages/EditorPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/new" element={<NewGrid />} />
      <Route path="/g/:viewId" element={<ViewerPage />} />
      <Route path="/edit/:editToken" element={<EditorPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
