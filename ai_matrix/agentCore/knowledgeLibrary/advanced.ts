import {
  NEBULAWATCH_AGENT_CAPABILITIES as CAPABILITIES,
  AGENT_FLAG_SET,
} from "./capabilities"
import {
  NEBULAWATCH_AGENT_GUIDE as DESCRIPTION,
  NEBULAWATCH_AGENT_VERSION as VERSION_TAG,
} from "./description"
import { NEBULAWATCH_AGENT_ID as AGENT_ID } from "./name"
import { KNOWLEDGE_AGENT_TOOLS as TOOLKIT } from "./tools"

import type { AssistantProfile } from "@/ai/agent"

export const nebulaKnowledgeAgent: AssistantProfile = Object.freeze({
  id: AGENT_ID,
  version: VERSION_TAG,
  label: "nebula-knowledge",
  promptBase: DESCRIPTION,
  features: {
    ...CAPABILITIES,
    flags: AGENT_FLAG_SET,
  },
  extensions: TOOLKIT,
} as const)
