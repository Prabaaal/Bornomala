export class ModeIndicator {
  private readonly element: HTMLDivElement;
  private activeTarget: HTMLElement | null = null;

  constructor() {
    this.element = document.createElement("div");
    this.element.setAttribute("data-bornomala-indicator", "true");
    this.element.textContent = "অ Bornomala";
    Object.assign(this.element.style, {
      position: "fixed",
      zIndex: "2147483647",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "#0f766e",
      color: "#ffffff",
      fontSize: "12px",
      fontFamily: "system-ui, sans-serif",
      fontWeight: "600",
      boxShadow: "0 6px 18px rgba(15, 118, 110, 0.24)",
      pointerEvents: "none",
      opacity: "0",
      transform: "translateY(-4px)",
      transition: "opacity 120ms ease, transform 120ms ease"
    });

    window.addEventListener("scroll", this.reposition, true);
    window.addEventListener("resize", this.reposition, true);
  }

  show(target: HTMLElement): void {
    this.activeTarget = target;

    if (!this.element.isConnected) {
      document.documentElement.appendChild(this.element);
    }

    this.reposition();
    this.element.style.opacity = "1";
    this.element.style.transform = "translateY(0)";
  }

  hide(): void {
    this.activeTarget = null;
    this.element.style.opacity = "0";
    this.element.style.transform = "translateY(-4px)";
  }

  destroy(): void {
    this.hide();
    this.element.remove();
    window.removeEventListener("scroll", this.reposition, true);
    window.removeEventListener("resize", this.reposition, true);
  }

  private readonly reposition = (): void => {
    if (!this.activeTarget) {
      return;
    }

    const rect = this.activeTarget.getBoundingClientRect();
    const top = Math.max(8, rect.top + 8);
    const left = Math.min(window.innerWidth - 140, Math.max(8, rect.right - 120));

    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  };
}
