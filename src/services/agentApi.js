export const submitExpense = async (payload, onStatusUpdate) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "/api";
  const sessionUrl = `${baseUrl}/apps/expense_agent/users/demo_user/sessions`;
  const runUrl = `${baseUrl}/run`;

  const headers = {
    "Content-Type": "application/json",
  };



  try {
    // Step 1: Create a new session
    const sessionRes = await fetch(sessionUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({})
    });
    if (!sessionRes.ok) {
      if (sessionRes.status === 403 || sessionRes.status === 401) {
        throw new Error("Authentication failed. Please verify your IAM token in settings.");
      }
      throw new Error(`Session creation failed: ${sessionRes.status}`);
    }
    const sessionData = await sessionRes.json();
    const sessionId = sessionData.id;

    // Step 2: Run the graph using the /run endpoint
    const runPayload = {
      appName: "expense_agent",
      userId: "demo_user",
      sessionId: sessionId,
      newMessage: {
        role: "user",
        parts: [{ text: JSON.stringify(payload) }]
      }
    };

    const runRes = await fetch(runUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(runPayload)
    });

    if (!runRes.ok) {
      const errText = await runRes.text();
      throw new Error(`Agent run failed (${runRes.status}): ${errText}`);
    }

    const events = await runRes.json();
    
    let finalStatus = "Processed successfully.";
    let requireHitl = false;

    // Scan the events to see if there is an approval, rejection, or request for input
    if (Array.isArray(events)) {
      for (const event of events) {
        // Check for Human-in-the-Loop request
        const parts = event.content?.parts || [];
        for (const part of parts) {
          if (part.functionCall?.name === "adk_request_input") {
            const args = part.functionCall.args || {};
            finalStatus = "Agent requested human review: " + (args.message || "Manual approval required.");
            requireHitl = true;
          }
        }
        
        // Check for final output
        if (event.output) {
          if (typeof event.output === 'string') {
            finalStatus = event.output;
          } else if (typeof event.output === 'object' && event.output !== null) {
            finalStatus = JSON.stringify(event.output);
          }
        }
      }
    }

    return {
      success: true,
      message: finalStatus,
      hitl: requireHitl
    };

  } catch (error) {
    console.error("Agent API Error:", error);
    return {
      success: false,
      message: error.message || "Failed to communicate with the Agent."
    };
  }
};
