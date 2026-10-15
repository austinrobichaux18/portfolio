import type { DestroyRef } from '@angular/core';
import type { InvestmentCalculator } from './investment-calculator';
import { SHARE_PARAMS, applyShareParams } from './investment-share';

/**
 * WebMCP (https://github.com/webmachinelearning/webmcp): a browser API that lets a page expose
 * tools to AI agents running in the browser. It's still experimental, so it's typed locally and
 * feature-detected — on browsers without `navigator.modelContext`, nothing is registered.
 */
export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<AgentToolResult>;
}

export interface AgentToolResult {
  content: { type: 'text'; text: string }[];
}

interface ModelContext {
  registerTool?: (tool: AgentTool) => { unregister?: () => void } | void;
  unregisterTool?: (name: string) => void;
}

const textResult = (value: unknown): AgentToolResult => ({
  content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
});

/** JSON Schema for set_investment_inputs, generated from the share-param table. */
function inputsSchema(): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const p of SHARE_PARAMS) {
    properties[p.key] = p.values
      ? { type: 'string', enum: p.values, description: p.description }
      : { description: p.description };
  }
  return { type: 'object', properties, additionalProperties: false };
}

export function buildInvestmentAgentTools(c: InvestmentCalculator): AgentTool[] {
  return [
    {
      name: 'get_investment_scenario',
      description:
        "Read the investment calculator's current inputs and results (ending balance, " +
        "today's-dollars balance, yearly retirement withdrawal, etc.) plus a shareable link.",
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => textResult(c.scenarioSummary()),
    },
    {
      name: 'set_investment_inputs',
      description:
        'Change any of the investment calculator inputs. Only the fields you pass change; the ' +
        'rest stay as they are. Returns the updated inputs and results.',
      inputSchema: inputsSchema(),
      execute: async (input) => {
        const applied = applyShareParams(c, input ?? {});
        const ignored = Object.keys(input ?? {}).filter((key) => !applied.includes(key));
        return textResult({ applied, ignored, ...c.scenarioSummary() });
      },
    },
    {
      name: 'reset_investment_calculator',
      description: 'Reset every investment calculator input to its default.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        c.reset();
        return textResult(c.scenarioSummary());
      },
    },
  ];
}

/** Registers the tools with the browser's WebMCP model context, if any, until the page is left. */
export function registerInvestmentAgentTools(
  c: InvestmentCalculator,
  destroyRef: DestroyRef,
): void {
  const modelContext =
    typeof navigator === 'undefined'
      ? undefined
      : (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
  if (!modelContext?.registerTool) return;

  const registrations: { name: string; unregister?: () => void }[] = [];
  for (const tool of buildInvestmentAgentTools(c)) {
    try {
      const handle = modelContext.registerTool(tool);
      registrations.push({ name: tool.name, unregister: handle?.unregister?.bind(handle) });
    } catch {
      // A tool with this name may already be registered (e.g. a lingering page) — skip it.
    }
  }

  destroyRef.onDestroy(() => {
    for (const { name, unregister } of registrations) {
      try {
        if (unregister) unregister();
        else modelContext.unregisterTool?.(name);
      } catch {
        // Already gone.
      }
    }
  });
}
