/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import * as Ably from "ably/promises";

import handler from "./index";
import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "@vercel/kv";

// Provide mocking for Ably
const mockPublish = jest.fn().mockImplementation(() => Promise.resolve());
const mockPresenceGet = jest.fn();
const setMockPresenceGetReturnItems = (items: any[]) => {
  mockPresenceGet.mockImplementation(() => Promise.resolve({ items }));
};

const mockGetChannel = jest.fn().mockImplementation(() => {
  const presence = {
    get: mockPresenceGet,
  };

  return { publish: mockPublish, presence };
});

jest.mock("ably/promises", () => {
  return {
    Rest: jest.fn().mockImplementation(() => {
      return { channels: { get: mockGetChannel } };
    }),
  };
});

const getParsedSendArg = (
  sendMockCalls: jest.MockedFunction<any>["mock"]["calls"],
) => {
  const sendArg = sendMockCalls[0][0]; // Get the first argument of the first call
  return JSON.parse(sendArg);
};

const req = () => {
  return {
    query: {},
  } as unknown as NextApiRequest;
};

const res = () => {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as NextApiResponse;
};

describe("Game API handler", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 if playerId is missing or not a string", async () => {
    const request = req();
    const response = res();
    await handler(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledWith(
      JSON.stringify(
        "playerId is required and must be a string",
      ),
    );
  });

  test("should create a new game if no open game is available", async () => {
    const request = req();
    const response = res();
    request.query.playerId = "player1";
    await handler(request, response);
    const parsedSendArg = getParsedSendArg(
      (response.send as jest.MockedFunction<any>).mock.calls,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(kv.set).toHaveBeenCalled();

    // If you have more specific expectations (e.g., the game ID that should be set),
    // you can use something like this:
    // expect(kv.set).toHaveBeenCalledWith("expectedGameId", expect.anything());
    expect(kv.set).toHaveBeenCalledWith("player1", expect.anything());
    expect(kv.set).toHaveBeenCalledWith("openGame", expect.anything());

    // If the response should include game details, you'd check those too.
    // This will depend on how your handler function is designed.
    // For example, if it sends JSON back:
    // expect(res.send).toHaveBeenCalledWith(
    //   expect.objectContaining({ gameId: "expectedGameId" }),
    // );

    expect(parsedSendArg).toMatchObject({
      players: ["player1"],
    });
  });

  test("should join an open game if one is available", async () => {
    const req1 = req();
    const res1 = res();
    req1.query.playerId = "player1";
    await handler(req1, res1);

    setMockPresenceGetReturnItems(["player1"]);

    const req2 = req();
    const res2 = res();
    req2.query.playerId = "player2";
    await handler(req2, res2);

    const p2 = getParsedSendArg(
      (res2.send as jest.MockedFunction<any>).mock.calls,
    );

    // expect p2 to include both player1 and player 2, but not to expect a certain order
    expect(p2.players).toContain("player1");
    expect(p2.players).toContain("player2");
  });
});
