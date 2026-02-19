import type { GatewayBrowserClient } from "../gateway.ts";
import type { AgentsListResult } from "../types.ts";

export type AgentsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  agentsLoading: boolean;
  agentsError: string | null;
  agentsList: AgentsListResult | null;
  agentsSelectedId: string | null;
  agentCreating: boolean;
  agentCreateError: string | null;
  agentDeleting: boolean;
  agentDeleteError: string | null;
};

export async function loadAgents(state: AgentsState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.agentsLoading) {
    return;
  }
  state.agentsLoading = true;
  state.agentsError = null;
  try {
    const res = await state.client.request<AgentsListResult>("agents.list", {});
    if (res) {
      state.agentsList = res;
      const selected = state.agentsSelectedId;
      const known = res.agents.some((entry) => entry.id === selected);
      if (!selected || !known) {
        state.agentsSelectedId = res.defaultId ?? res.agents[0]?.id ?? null;
      }
    }
  } catch (err) {
    state.agentsError = String(err);
  } finally {
    state.agentsLoading = false;
  }
}

export async function createAgent(state: AgentsState, name: string) {
  if (!state.client || !state.connected || state.agentCreating) {
    return;
  }
  state.agentCreating = true;
  state.agentCreateError = null;
  try {
    const res = await state.client.request<{ agentId: string }>("agents.create", { name });
    if (res && res.agentId) {
      state.agentsSelectedId = res.agentId;
      await loadAgents(state);
    }
  } catch (err) {
    state.agentCreateError = String(err);
  } finally {
    state.agentCreating = false;
  }
}

export async function deleteAgent(state: AgentsState, agentId: string) {
  if (!state.client || !state.connected || state.agentDeleting) {
    return;
  }
  state.agentDeleting = true;
  state.agentDeleteError = null;
  try {
    await state.client.request("agents.delete", { agentId });
    if (state.agentsSelectedId === agentId) {
      state.agentsSelectedId = null;
    }
    await loadAgents(state);
  } catch (err) {
    state.agentDeleteError = String(err);
  } finally {
    state.agentDeleting = false;
  }
}
