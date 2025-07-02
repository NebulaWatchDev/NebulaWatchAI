export class KnowledgeAgentBrain {
  private thoughts: string[] = [];
  private lastInsight: string = "";

  injectMemory(chunk: string) {
    this.thoughts.push(chunk);
    if (this.thoughts.length > 30) this.thoughts.shift();
  }

  reflect(): string {
    const composite = this.thoughts.join(" | ");
    this.lastInsight = `Summary thought: ${composite.slice(-180)}`;
    return this.lastInsight;
  }

  evaluate(tokenSignal: string): string {
    const isWorrying = tokenSignal.includes("drop") || tokenSignal.includes("volatile");
    return isWorrying ? "Engage Monitoring" : "Stable Observation";
  }

  synthesize(): Record<string, any> {
    return {
      insight: this.lastInsight || "No data synthesized yet",
      tokensAnalyzed: this.thoughts.length,
      timestamp: new Date().toISOString()
    };
  }
}