/* Record deletion rules shared by the CRM screens and regression checks. */
const CrmCrud = (() => {
  const list = (data, key) => Array.isArray(data[key]) ? data[key] : [];
  const removeWhere = (data, key, predicate) => {
    const before = list(data, key);
    data[key] = before.filter(item => !predicate(item));
    return before.length - data[key].length;
  };
  const remember = (data, id) => {
    if (!Array.isArray(data.deletedSeedIds)) data.deletedSeedIds = [];
    if (!data.deletedSeedIds.includes(id)) data.deletedSeedIds.push(id);
  };
  const removeCanvases = (data, deploymentIds) => {
    if (!data.workflowCanvases) return;
    for (const id of deploymentIds) delete data.workflowCanvases[id];
  };
  const linked = (data, kind, id) => {
    const client = kind === 'client';
    const branchIds = new Set(client ? list(data, 'branches').filter(x => x.clientId === id).map(x => x.id) : [id]);
    const match = x => client ? x.clientId === id || branchIds.has(x.branchId) : x.branchId === id;
    return {
      branches: client ? branchIds.size : 0,
      products: list(data, 'deployments').filter(match).length,
      invoices: list(data, 'invoices').filter(match).length,
      cases: list(data, 'tickets').filter(x=>match(x)||(x.branchIds||[]).some(id=>branchIds.has(id))).length,
      requirements: list(data, 'requirements').filter(match).length,
      documents: client ? list(data, 'documents').filter(match).length : 0,
      contacts: client ? list(data, 'contacts').filter(match).length : 0,
      mail: client ? list(data, 'messages').filter(match).length + list(data, 'mailDrafts').filter(match).length : 0,
      followUps: client ? list(data, 'reminders').filter(match).length + list(data, 'tasks').filter(match).length : 0
    };
  };
  const remove = (data, kind, id) => {
    if (kind !== 'client' && kind !== 'branch') return false;
    const record = list(data, kind === 'client' ? 'clients' : 'branches').find(x => x.id === id);
    if (!record) return false;
    // Keep the client and every affected branch available for support history.
    if (list(data,'tickets').some(t=>kind==='client'?t.clientId===id:t.branchId===id||(t.branchIds||[]).includes(id))) return false;
    const client = kind === 'client';
    const branchIds = new Set(client ? list(data, 'branches').filter(x => x.clientId === id).map(x => x.id) : [id]);
    const match = x => client ? x.clientId === id || branchIds.has(x.branchId) : x.branchId === id;
    const deployments = list(data, 'deployments').filter(match).map(x => x.id);
    removeCanvases(data, deployments);
    for (const key of ['deployments', 'invoices', 'tickets', 'requirements']) removeWhere(data, key, match);
    if (client) {
      for (const branch of list(data, 'branches').filter(x => x.clientId === id)) remember(data, branch.id);
      for (const key of ['branches', 'documents', 'contacts', 'messages', 'mailDrafts', 'reminders', 'tasks', 'activity']) removeWhere(data, key, match);
      for (const lead of list(data, 'leads').filter(x => x.convertedClientId === id)) {
        lead.stage = 'Qualified';
        delete lead.convertedClientId;
        (lead.history ||= []).push({at:new Date().toLocaleString('en-IN'),text:'Linked client deleted; prospect reopened'});
      }
      for (const deal of list(data, 'deals')) if (deal.clientId === id) deal.clientId = '';
      for (const chat of list(data, 'chats')) if (Array.isArray(chat.sources)) chat.sources = chat.sources.filter(source => source.id !== id && !branchIds.has(source.id));
      removeWhere(data, 'clients', x => x.id === id);
    } else {
      removeWhere(data, 'branches', x => x.id === id);
      const parent = list(data, 'clients').find(x => x.id === record.clientId);
      if (parent?.city === record.city && /head office/i.test(record.name)) {
        const other = list(data, 'branches').find(x => x.clientId === parent.id && /head office/i.test(x.name));
        if (other) parent.city = other.city;
      }
    }
    remember(data, id);
    return true;
  };
  return {linked, remove};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CrmCrud;
