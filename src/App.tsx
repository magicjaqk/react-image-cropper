import React from "react";
import ImageCropper from "./ImageCropper";

type Props = {};

const App = (props: Props) => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-500">
      <div className="relative w-96 rounded-md bg-slate-900 p-4 text-white">
        <ImageCropper />
      </div>
    </div>
  );
};

export default App;
