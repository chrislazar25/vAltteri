export function activate(host) {
  if (host.apiVersion !== '1') throw new Error('Canvas extension API 1 is required.');
  return host.registerPage('check', ({ container }) => {
    const section = document.createElement('section');
    section.setAttribute('aria-label', 'vAltteri connection check');
    section.style.cssText = 'padding:24px;max-width:680px;margin:0 auto;line-height:1.6;color:inherit';
    section.innerHTML = `
      <h1 style="font-size:24px;font-weight:600;margin-bottom:8px">vAltteri connection check</h1>
      <p>Phase 2 · Local laptop connection</p>
      <p>Verify Canvas access, then connect to the vAltteri diagnostic service.</p>
      <button type="button" data-canvas style="padding:8px 12px;border:1px solid currentColor;border-radius:6px;margin:16px 0">Check Canvas backend</button>
      <p data-canvas-status role="status">Canvas backend: unchecked</p>
      <form style="display:grid;gap:12px;margin-top:24px">
        <label>Service address<input name="address" type="url" value="http://127.0.0.1:18080" required style="display:block;width:100%;padding:8px;border:1px solid currentColor;border-radius:6px;background:transparent"></label>
        <label>Connection token<input name="token" type="password" autocomplete="off" required style="display:block;width:100%;padding:8px;border:1px solid currentColor;border-radius:6px;background:transparent"></label>
        <button type="submit" style="padding:8px 12px;border:1px solid currentColor;border-radius:6px;justify-self:start">Check service connection</button>
      </form>
      <p data-service-status role="status" style="margin-top:16px;overflow-wrap:anywhere">Service: unchecked</p>`;
    container.append(section);
    let disposed = false;
    let controller;
    const canvasStatus = section.querySelector('[data-canvas-status]');
    const serviceStatus = section.querySelector('[data-service-status]');
    const backendButton = section.querySelector('[data-canvas]');
    backendButton.addEventListener('click', async () => {
      backendButton.disabled = true;
      canvasStatus.textContent = 'Canvas backend: checking…';
      try {
        const result = await host.agentServer.request({ path: '/api/canvas-extensions/installed' });
        if (!Array.isArray(result.canvas_extensions)) throw new Error('Unexpected response');
        if (!disposed) canvasStatus.textContent = 'Canvas backend: authenticated request succeeded';
      } catch {
        if (!disposed) canvasStatus.textContent = 'Canvas backend: request failed';
      } finally { if (!disposed) backendButton.disabled = false; }
    });
    section.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      const timeout = setTimeout(() => current.abort(), 10000);
      serviceStatus.textContent = 'Service: checking…';
      try {
        const address = new URL(section.querySelector('[name=address]').value);
        if (address.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(address.hostname) || address.username || address.password) {
          throw new Error('Use a local HTTP service address for this probe.');
        }
        const response = await fetch(`${address.origin}/connection-check`, {
          method: 'GET', credentials: 'omit', redirect: 'error', signal: current.signal,
          headers: { Authorization: `Bearer ${section.querySelector('[name=token]').value}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.service !== 'valtteri-phase-2' || typeof result.requestId !== 'string' || !Number.isFinite(Date.parse(result.timestamp))) throw new Error('Unexpected response');
        if (!disposed && controller === current) serviceStatus.textContent = `Service: connected · Request ${result.requestId} · ${result.timestamp}`;
      } catch (error) {
        if (!disposed && controller === current) serviceStatus.textContent = `Service: failed · ${error.message}`;
      } finally { clearTimeout(timeout); }
    });
    return () => { disposed = true; controller?.abort(); section.querySelector('[name=token]').value = ''; section.remove(); };
  });
}
