import { task } from "@trigger.dev/sdk";

export const helloWorld = task({
  id: "hello-world",
  run: async (payload: { name: string }) => {
    const message = `Hello ${payload.name}!`;
    console.log(message);

    return {
      message,
      timestamp: new Date().toISOString(),
    };
  },
});
