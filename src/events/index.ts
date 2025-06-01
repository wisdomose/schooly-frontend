export const EVENTS = {
  LOCATION: {
    JOIN_ROOM: "location:join_room",
    LEAVE_ROOM: "location:leave_room",
    UPDATE_LOCATION: "location:update_location",
  },

  NOTIFICATION: {
    JOIN_ROOM: "join-room",
    LEAVE_ROOM: "leave-room",
    UPDATE: "update",
    UNREAD_COUNT: "unread-count",
    READ_ALL: "read-all",
  },

  MESSAGE: {
    JOIN_ROOM: "join-room",
    LEAVE_ROOM: "leave-room",
    SEND_MESSAGE: "send-message",
    NEW_MESSAGE: "new-message",
    MESSAGE_READ: "message-read",
    TYPING_START: "typing-start",
    TYPING_STOP: "typing-stop",
    USER_TYPING: "user-typing",
    USER_STOPPED_TYPING: "user-stopped-typing",
  },

  ROOM: {
    ROOM_CREATED: "room:room_created",
    ROOM_UPDATED: "room:room_updated",
    ROOM_DELETED: "room:room_deleted",
    USER_JOINED: "room:user_joined",
    USER_LEFT: "room:user_left",
  },
} as const;
