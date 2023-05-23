import { useEffect, useState, useRef, useCallback } from "react";
import { useEntityQuery } from "@latticexyz/react";
import useLocalStorageState from "use-local-storage-state";
import TextareaAutosize from "react-autosize-textarea";
import { blake3 } from "@noble/hashes/blake3";
import { useLiveQuery } from "dexie-react-hooks";
import { Message, modelDB } from "./libp2p/db";
import { encode } from "microcbor";
import { ethers } from "ethers";

import { useLibp2p } from "./libp2p";
import { CHAT_TOPIC } from "./libp2p/constants";

type EmbeddableChatProps = {
  as: string;
  withEntityQuery: unknown;
};

export const EmbeddableChat: React.FC<EmbeddableChatProps> = ({
  as,
  withEntityQuery,
}) => {
  const players: string[] = useEntityQuery(withEntityQuery);
  const messages = useLiveQuery(
    () => modelDB.messages.limit(100).sortBy("timestamp"),
    []
  );

  // `as` is your address, `players` is all addresses who can chat
  const [draft, setDraft] = useLocalStorageState("embeddable-chat-draft", {
    defaultValue: "",
  });

  const [sending, setSending] = useState<boolean>();
  const scrollElementRef = useRef<HTMLDivElement>();

  const { connectionCount, libp2p } = useLibp2p();

  const [signer, setSigner] = useState<ethers.Wallet>();
  const refreshSigner = () => {
    const mudBurnerWallet = localStorage.getItem("mud:burnerWallet");
    if (!mudBurnerWallet) return;
    setSigner(new ethers.Wallet(mudBurnerWallet));
  };
  useEffect(refreshSigner, []);

  useEffect(() => {
    if (!scrollElementRef.current) return;
    scrollElementRef.current.scrollTop = scrollElementRef.current.scrollHeight;
  }, [messages && messages.length !== 0]);

  const handleSend = useCallback(
    async (content: string, signer: ethers.Wallet) => {
      setDraft("");

      const timestamp = Date.now();
      const message: Message = {
        from: as,
        content,
        timestamp,
        signature: await signer.signMessage(
          encode({ from: as, content, timestamp })
        ),
      };
      const value = encode(message);
      const key = blake3(value, { dkLen: 16 });

      return libp2p.services[CHAT_TOPIC].insert(key, value).catch((err) => {
        console.error(err);
        throw err;
      });
    },
    [libp2p, as]
  );

  return (
    <EmbeddableChatWrapper
      label={`Chat (${connectionCount} connections)`}
      labelShort={"Chat"}
      address={as}
    >
      {/* contents go here */}
      <div className="relative h-full">
        <div className="overflow-auto max-h-64 pb-2" ref={scrollElementRef}>
          {messages &&
            messages.map((message) => {
              const { id } = message as Message & { id?: number };
              return (
                <div key={id} className="">
                  {message.from.slice(0, 4)}: {message.content}
                </div>
              );
            })}
        </div>

        <div className="absolute bottom-0 w-full">
          <TextareaAutosize
            autoFocus={true}
            readOnly={sending}
            placeholder="New message"
            className="mt-2 bg-gray-700 w-full outline-none border-none resize-none px-2 py-1 rounded max-h-16"
            defaultValue={draft}
            // @ts-expect-error
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") e.stopPropagation();
            }}
            onKeyPress={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setSending(true);
                if (!signer) return refreshSigner();
                handleSend(draft, signer)
                  .then(() => {
                    e.target.value = "";
                  })
                  .finally(() => {
                    setSending(false);
                    if (!scrollElementRef.current) return;
                    scrollElementRef.current.scrollTop =
                      scrollElementRef.current.scrollHeight;
                  });
              }
            }}
          />
        </div>
      </div>
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
  const [names, setNames] = useState({});
  const [name, setName] = useLocalStorageState("embeddable-chat-name");
  // TODO: sync these with the world, or with an accumulator in merkle sync

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpened(!opened);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const { libp2p, connectionCount } = useLibp2p();

  const nameInputRef = useRef<HTMLInputElement>(null);

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
            top: 0,
            right: 20,
            borderRadius: "0 0 4px 4px",
            height: "auto",
          }}
          className="w-64 bg-gray-800"
        >
          <div className="border-b border-gray-700 flex text-sm">
            <div className="pl-4 py-2 flex-1">
              {labelShort} ({connectionCount} connections)
            </div>
            <div
              className="pr-4 py-2 pl-4 cursor-pointer border-l-1 text-gray-500 hover:text-gray-200"
              onClick={() => {
                setOpened(false);
              }}
            >
              Hide (Esc)
            </div>
          </div>
          <div className="border-b border-gray-700 flex text-sm text-gray-500">
            {name && (
              <div className="pl-4 py-2 flex-1">
                Logged in as{" "}
                <span
                  onClick={() => setName(undefined)}
                  className="cursor-pointer hover:text-white"
                >
                  {name}
                </span>
              </div>
            )}
          </div>
          <div className="px-4 py-3 h-80">
            {name === undefined ? (
              <>
                <div className="text-center pt-16">Choose a name</div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = nameInputRef.current?.value || "";
                    if (!name || !name.trim()) return;
                    setName(name);
                    setNames({ ...names, [address]: name });
                  }}
                >
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="anonymous"
                    autoFocus={true}
                    className="my-3 bg-gray-700 w-full outline-none border-none px-2 py-1 rounded"
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                  />
                  <input
                    type="submit"
                    value="Save"
                    style={{ fontSize: "93%" }}
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
