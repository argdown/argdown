import type { Disposable as VscodeDisposable } from "vscode";

export function disposeAll(disposables: VscodeDisposable[]) {
  while (disposables.length) {
    const item = disposables.pop();
    item?.dispose();
  }
}

export abstract class Disposable {
  private _isDisposed = false;

  protected _disposables: VscodeDisposable[] = [];

  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    disposeAll(this._disposables);
  }

  protected _register<T extends VscodeDisposable>(value: T): T {
    if (this._isDisposed) {
      value.dispose();
    } else {
      this._disposables.push(value);
    }
    return value;
  }

  protected get isDisposed() {
    return this._isDisposed;
  }
}
