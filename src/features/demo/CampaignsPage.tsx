import { useState } from 'react';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import { DemoShell } from './DemoPages';
import { demoCampaigns, type Campaign, type CampaignStatus } from './demoData';

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(demoCampaigns);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('Rascunho');

  function openDialog(campaign?: Campaign) {
    setEditingId(campaign?.id ?? null);
    setTitle(campaign?.title ?? '');
    setDescription(campaign?.description ?? '');
    setStatus(campaign?.status ?? 'Rascunho');
    setIsDialogOpen(true);
  }

  function saveCampaign() {
    if (!title.trim()) {
      return;
    }

    if (editingId !== null) {
      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === editingId ? { ...campaign, title, description, status } : campaign,
        ),
      );
    } else {
      setCampaigns((current) => [
        {
          id: Date.now(),
          title,
          business: 'Minha empresa',
          segment: 'Geral',
          description,
          status,
        },
        ...current,
      ]);
    }

    setIsDialogOpen(false);
  }

  function deleteCampaign(id: number) {
    if (window.confirm('Excluir esta campanha demonstrativa?')) {
      setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
    }
  }

  return (
    <DemoShell
      business
      title="Minhas campanhas"
      subtitle="Crie e gerencie campanhas sem sair da plataforma."
    >
      <div className="toolbar">
        <span>{campaigns.length} campanhas demonstrativas</span>
        <button className="btn primary" type="button" onClick={() => openDialog()}>
          <Plus size={17} aria-hidden="true" /> Nova campanha
        </button>
      </div>
      <div className="panel campaigns" aria-live="polite">
        {campaigns.map((campaign) => (
          <div className="campaign-row" key={campaign.id}>
            <div className="campaign-symbol">
              <Megaphone size={20} aria-hidden="true" />
            </div>
            <div className="campaign-info">
              <strong>{campaign.title}</strong>
              <small>{campaign.description || 'Sem descrição'}</small>
            </div>
            <span className={`tag${campaign.status === 'Rascunho' ? ' draft' : ''}`}>
              {campaign.status}
            </span>
            <button
              className="iconbtn"
              type="button"
              onClick={() => openDialog(campaign)}
              aria-label={`Editar ${campaign.title}`}
            >
              Editar
            </button>
            <button
              className="iconbtn danger"
              type="button"
              onClick={() => deleteCampaign(campaign.id)}
              aria-label={`Excluir ${campaign.title}`}
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p role="status">Nenhuma campanha cadastrada. Crie a primeira!</p>
        )}
      </div>
      {isDialogOpen && (
        <div className="modal-back">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="campaign-title">
            <div className="modal-head">
              <h2 id="campaign-title">
                {editingId !== null ? 'Editar campanha' : 'Nova campanha'}
              </h2>
              <button
                className="iconbtn"
                type="button"
                onClick={() => setIsDialogOpen(false)}
                aria-label="Fechar"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <label>
              Nome da campanha
              <input
                value={title}
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Semana de vantagens"
              />
            </label>
            <label>
              Descrição
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descreva o benefício e as condições"
                rows={3}
              />
            </label>
            <label>
              Situação
              <select
                value={status}
                onChange={(event) => {
                  const nextStatus = event.target.value;
                  if (
                    nextStatus === 'Ativa' ||
                    nextStatus === 'Rascunho' ||
                    nextStatus === 'Encerrada'
                  ) {
                    setStatus(nextStatus);
                  }
                }}
              >
                <option>Rascunho</option>
                <option>Ativa</option>
                <option>Encerrada</option>
              </select>
            </label>
            <div className="modal-actions">
              <button className="btn subtle" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </button>
              <button
                className="btn primary"
                type="button"
                disabled={!title.trim()}
                onClick={saveCampaign}
              >
                Salvar campanha
              </button>
            </div>
            <p className="smallprint">
              As alterações existem apenas nesta sessão. Recarregar restaura os dados iniciais.
            </p>
          </div>
        </div>
      )}
    </DemoShell>
  );
}
