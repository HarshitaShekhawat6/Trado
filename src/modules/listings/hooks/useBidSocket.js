// modules/listings/hooks/useBidSocket.js
//
// Manages a Socket.IO connection scoped to a single product's bid room.
//
// Usage:
//   useBidSocket({
//     productId: product.id,
//     enabled:   true,          // only connect when the modal is open
//     onNewBid:  (bid) => {},   // called with { id, bidder_name, amount, created_at }
//   });
//
// The hook:
//   - Connects when `enabled` becomes true
//   - Joins the room `bid:<productId>` immediately on connection
//   - Calls onNewBid for every "new_bid" event received from the server
//   - Leaves the room and disconnects when `enabled` becomes false
//   - Auto-reconnects with Socket.IO's built-in backoff (no extra logic needed)

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

import { API_BASE_URL } from "../../../api/client";
// ↑ Export your base URL from wherever you define apiClient, for example:
//   export const API_BASE_URL = "https://your-api.com";
// If you don't have this export yet, replace the import with a direct string:
//   const SOCKET_URL = "https://your-api.com";

const SOCKET_URL = API_BASE_URL;

const useBidSocket = ({ productId, enabled = false, onNewBid }) => {
  const socketRef   = useRef(null);
  const onNewBidRef = useRef(onNewBid); // stable ref — avoids re-connecting on every render

  // Keep the callback ref fresh without triggering the effect
  useEffect(() => {
    onNewBidRef.current = onNewBid;
  }, [onNewBid]);

  useEffect(() => {
    if (!enabled || !productId) return;

    // ── Connect ─────────────────────────────────────────────────────────────
    const socket = io(SOCKET_URL, {
      transports: ["websocket"], // skip polling for mobile — faster handshake
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // ── Join the product's bid room on connection ────────────────────────────
    socket.on("connect", () => {
      socket.emit("join_bid_room", { productId });
    });

    // ── Handle incoming bid ──────────────────────────────────────────────────
    // Payload: { id, bidder_name, amount, created_at }
    // Note is never included — the server strips it before broadcasting.
    socket.on("new_bid", (bid) => {
      if (onNewBidRef.current) {
        onNewBidRef.current(bid);
      }
    });

    // ── Debug helpers (stripped by bundler in production builds) ─────────────
    if (__DEV__) {
      socket.on("connect_error", (err) => {
        console.warn("[BidSocket] connect_error:", err.message);
      });
      socket.on("disconnect", (reason) => {
        console.log("[BidSocket] disconnected:", reason);
      });
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      socket.emit("leave_bid_room", { productId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, productId]); // only reconnect if productId or enabled changes
};

export { useBidSocket };