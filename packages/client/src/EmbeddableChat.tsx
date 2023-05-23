import { useEffect, useState, useRef } from "react";
import { useEntityQuery } from "@latticexyz/react";

export const EmbeddableChat: React.FC<EmbeddableChatProps> = ({
  as,
  withEntityQuery,
}) => {
  const players: string[] = useEntityQuery(withEntityQuery);
  // `as` is your address, `players` is all addresses who can chat

  return (
    <EmbeddableChatWrapper
      label={"Chat (0 online)"}
      labelShort={"Chat"}
      address={as}
    >
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
  address: string;
}> = ({ children, label, labelShort, address }) => {
  const [opened, setOpened] = useState(true);
  const [name, setName] = useState(); // TODO: sync with world
  const [names, setNames] = useState({});

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpened(!opened);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const nameInputRef = useRef();

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        zIndex: 999,
      }}
    >
      {!opened && (
        <div
          style={{
            position: "relative",
            right: 20,
            width: 160,
            borderRadius: "0 0 4px 4px",
            textAlign: "center",
            cursor: "pointer",
          }}
          className="py-2 text-sm bg-gray-800 text-gray-200 opacity-90 hover:opacity-100"
          onClick={() => setOpened(!opened)}
        >
          <div>{label}</div>
        </div>
      )}
      {opened && (
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 20,
            borderRadius: 4,
            height: "auto",
          }}
          className="w-64 bg-gray-800"
        >
          <div className="border-b border-gray-700 flex text-sm">
            <div className="pl-4 py-2 flex-1">{labelShort}</div>
            <div
              className="pr-4 py-2 pl-4 cursor-pointer border-l-1 text-gray-600 hover:text-gray-200"
              onClick={() => {
                setOpened(false);
              }}
            >
              Hide (Esc)
            </div>
          </div>
          <div className="px-4 py-3 h-80">
            {name === undefined ? (
              <>
                <div className="text-center pt-10">Choose a name</div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = nameInputRef.current.value;
                    if (!name || !name.trim()) return;
                    // TODO: submit p2p msg with name, or call worldSend
                    setName(name);
                    setNames({ ...names, [address]: name });
                  }}
                >
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="anon007"
                    className="my-3 bg-gray-700 w-full outline-none border-none px-2 py-1 rounded"
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                  />
                  <input
                    type="submit"
                    value="Save"
                    className="cursor-pointer w-full bg-gray-700 hover:opacity-90 px-2 py-1 rounded"
                  />
                </form>
              </>
            ) : (
              children
            )}
          </div>
        </div>
      )}
    </div>
  );
};
