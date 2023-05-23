import { useEffect, useState } from "react";

type EmbeddableChatProps = {
  // TODO: verifier function
  // TODO: wallet identification function
};

export const EmbeddableChat: React.FC<EmbeddableChatProps> = () => {
  return (
    <EmbeddableChatWrapper label={"Chat (0 online)"} labelShort={"Chat"}>
      {/* contents go here */}
      <div className="">Alice: hello world</div>
      <div className="">Bob: hi alice</div>
    </EmbeddableChatWrapper>
  );
};

// component for toggling the visibility of the embed.
const EmbeddableChatWrapper: React.FC<{
  children: JSX.Element | JSX.Element[];
  label: string;
  labelShort: string;
}> = ({ children, label, labelShort }) => {
  const [opened, setOpened] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          height: 48,
          top: `calc(75vh - ${160 / 2 + 48}px)`,
          width: 160,
          padding: "12px 20px",
          transform: "rotate(-90deg)",
          transformOrigin: "bottom right",
          borderRadius: "4px 4px 0 0",
          textAlign: "center",
          cursor: "pointer",
        }}
        className="bg-gray-800 text-gray-200 opacity-90 hover:opacity-100"
        onClick={() => setOpened(!opened)}
      >
        <div>{label}</div>
      </div>
      {opened && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            borderRadius: 4,
            height: "auto",
          }}
          className="w-64 bg-gray-800"
        >
          <div className="px-4 py-2 border-b border-gray-700">{labelShort}</div>
          <div className="px-4 py-3 h-80">{children}</div>
        </div>
      )}
    </div>
  );
};
