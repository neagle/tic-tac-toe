import { NextApiRequest, NextApiResponse } from "next";
import Ably from "ably/promises";

const { ABLY_API_KEY = "" } = process.env;
const rest = new Ably.Rest(ABLY_API_KEY);

const auth = async (request: NextApiRequest, response: NextApiResponse) => {
  const { clientId } = request.query;

  try {
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId: Array.isArray(clientId) ? clientId[0] : clientId,
    });
    response.setHeader("Content-Type", "application/json");
    response.send(JSON.stringify(tokenRequest));
  } catch (err) {
    response.status(500).send("Error requesting token: " + JSON.stringify(err));
  }
};

export default auth;
