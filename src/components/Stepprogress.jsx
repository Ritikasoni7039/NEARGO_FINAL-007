const StepProgress = ({ step = 1 }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-2xl font-medium text-[#54749a]">
        Step {step} of 2
      </h2>

      <div className="flex gap-2">
        <div
          className={`w-[120px] h-2 rounded-full ${
            step >= 1 ? "bg-[#16b8b5]" : "bg-[#dce5ee]"
          }`}
        />

        <div
          className={`w-[120px] h-2 rounded-full ${
            step >= 2 ? "bg-[#16b8b5]" : "bg-[#dce5ee]"
          }`}
        />
      </div>
    </div>
  );
};

export default StepProgress;