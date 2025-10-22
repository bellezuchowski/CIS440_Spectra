// public/js/footprint.js

document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('jwtToken');
      window.location.href = '/';
    });
  }

  const token = localStorage.getItem('jwtToken');
  if (!token) { window.location.href = '/'; return; }

 const HDRS = {
  'Content-Type': 'application/json',
  'Authorization': localStorage.getItem('jwtToken') // no "Bearer "
};

  const ids = x => document.getElementById(x);
  const form = ids('fp-form');
  const msg  = ids('fp-msg');
  const sum  = ids('fp-summary');
  if (!form || !msg || !sum) return;

  const inputs = {
    steps: ids('fp-steps'),
    walk_hours: ids('fp-walk'),
    run_hours: ids('fp-run'),
    cycle_hours: ids('fp-cycle'),
    hiking_hours: ids('fp-hike'),
    swimming_hours: ids('fp-swim')
  };

  const CAR_KG_PER_KM = 0.16;

  function renderFromValues(v) {
    // convert to km
    const km_steps = (v.steps || 0) / 1300.0;
    const km_walk  = (v.walk_hours || 0) * 5.0;
    const km_run   = (v.run_hours  || 0) * 9.6;
    const km_cycle = (v.cycle_hours || 0) * 16.0;
    const km_hike  = (v.hiking_hours || 0) * 4.0;
    const km_swim  = (v.swimming_hours || 0) * 2.0;

    const total_km = km_steps + km_walk + km_run + km_cycle + km_hike + km_swim;

    const co2 = {
      steps: km_steps * CAR_KG_PER_KM,
      walk:  km_walk  * CAR_KG_PER_KM,
      run:   km_run   * CAR_KG_PER_KM,
      cycle: km_cycle * CAR_KG_PER_KM,
      hike:  km_hike  * CAR_KG_PER_KM,
      swim:  km_swim  * CAR_KG_PER_KM,
      total: total_km * CAR_KG_PER_KM
    };

    sum.innerHTML = `
      <div><strong>Total distance:</strong> ${total_km.toFixed(2)} km</div>
      <div><strong>Total CO₂e avoided:</strong> ${co2.total.toFixed(3)} kg</div>
      <hr>
      <div>Steps: ${km_steps.toFixed(2)} km → ${co2.steps.toFixed(3)} kg</div>
      <div>Walk: ${km_walk.toFixed(2)} km → ${co2.walk.toFixed(3)} kg</div>
      <div>Run: ${km_run.toFixed(2)} km → ${co2.run.toFixed(3)} kg</div>
      <div>Cycle: ${km_cycle.toFixed(2)} km → ${co2.cycle.toFixed(3)} kg</div>
      <div>Hike: ${km_hike.toFixed(2)} km → ${co2.hike.toFixed(3)} kg</div>
      <div>Swim: ${km_swim.toFixed(2)} km → ${co2.swim.toFixed(3)} kg</div>
    `;
  }

  
  async function loadInitial() {
    try {
      const r = await fetch('/api/footprint', { headers: HDRS });
      if (r.ok) {
        const d = await r.json();
        // d.inputs should have the fields
        const values = d.inputs || {};
        Object.entries(inputs).forEach(([k, el]) => {
          if (el) el.value = values[k] ?? '';
        });
        renderFromValues(values);
        return;
      }
    } catch (_) {}

    
    const saved = JSON.parse(localStorage.getItem('fpInputs') || '{}');
    Object.entries(inputs).forEach(([k, el]) => { if (el) el.value = saved[k] ?? ''; });
    renderFromValues(saved);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const payload = {};
    Object.entries(inputs).forEach(([k, el]) => {
      if (el) payload[k] = Number(el.value || 0);
    });

    // Save locally as a fallback
    localStorage.setItem('fpInputs', JSON.stringify(payload));

    // Try to save to server
    try {
      const r = await fetch('/api/footprint', {
        method: 'PATCH',
        headers: HDRS,
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        msg.textContent = err.error || `Save failed (${r.status}) — saved locally only.`;
        // still render from local payload
        renderFromValues(payload);
        return;
      }
      const updated = await r.json();
      
      renderFromValues(updated.inputs || payload);
      msg.textContent = 'Saved!';
    } catch (e2) {
      console.error(e2);
      msg.textContent = 'Network error — saved locally only.';
      renderFromValues(payload);
    }
  });

  loadInitial();
});
