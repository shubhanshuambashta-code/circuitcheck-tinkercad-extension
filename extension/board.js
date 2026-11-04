export const maxBoardBytes = 5 * 1024 * 1024;

export function reviewBoard(xml) {
  if (/<!ENTITY\b|<!DOCTYPE[^>]*\[/i.test(xml)) {
    throw new Error('This file contains unsupported XML entity declarations. Choose an EAGLE XML board export.');
  }

  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const board = document.querySelector('eagle > drawing > board');
  const elements = board?.querySelector(':scope > elements');
  const signals = board?.querySelector(':scope > signals');
  if (document.querySelector('parsererror') || document.documentElement.tagName !== 'eagle' || !elements || !signals) {
    throw new Error('Choose a valid EAGLE XML board (.brd) export.');
  }

  const findings = [];
  const components = new Set();
  const connected = new Set();
  const padSignals = new Map();
  const componentRows = elements.querySelectorAll(':scope > element');
  const signalRows = signals.querySelectorAll(':scope > signal');

  function add(kind, rule, subject, detail) {
    findings.push({ kind, rule, subject, detail });
  }

  function required(node, attribute) {
    const value = node.getAttribute(attribute);
    if (!value?.trim()) {
      throw new Error(`Invalid board export: a ${node.tagName} entry is missing ${attribute}.`);
    }
    return value;
  }

  for (const element of componentRows) {
    const name = required(element, 'name');
    if (components.has(name)) {
      add('error', 'Duplicate component reference', name, 'Multiple exported components have this reference.');
    }
    components.add(name);
  }

  for (const [index, signal] of signalRows.entries()) {
    const name = required(signal, 'name');
    const contacts = new Set();

    for (const contact of signal.querySelectorAll(':scope > contactref')) {
      const component = required(contact, 'element');
      const pad = required(contact, 'pad');
      const key = JSON.stringify([component, pad]);
      if (contacts.has(key)) continue;
      contacts.add(key);

      const subject = `${component} / ${pad}`;
      if (!components.has(component)) {
        add('error', 'Unknown component reference', subject, `Signal ${name} references a component absent from the export.`);
      } else {
        connected.add(component);
      }

      const previous = padSignals.get(key);
      if (previous) {
        add('error', 'Pad assigned to multiple signals', subject, `Signal entries #${previous.index} (${previous.name}) and #${index + 1} (${name}) both reference this pad.`);
      } else {
        padSignals.set(key, { name, index: index + 1 });
      }
    }

    if (contacts.size === 1) {
      add('review', 'Signal with one contact', name, 'The export lists one distinct contact. Check whether the signal is intentionally isolated.');
    }
  }

  for (const component of components) {
    if (!connected.has(component)) {
      add('review', 'Component without exported contacts', component, 'No signal references this component. Check the design and export coverage.');
    }
  }

  return { components: componentRows.length, signals: signalRows.length, contacts: padSignals.size, findings };
}
