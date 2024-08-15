

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from './Login';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Login/>} />
        {/* <Route path="*" element={<PageNotFound />} /> */}
      </Routes>
    </Router>
  );
}