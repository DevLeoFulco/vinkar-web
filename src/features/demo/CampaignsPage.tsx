import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { DemoShell } from './DemoPages';
import { demoCampaigns, type Campaign, type CampaignStatus } from './demoData';

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(demoCampaigns);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('Rascunho');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  function openDialog(campaign?: Campaign) {
    setEditingId(campaign?.id ?? null);
    setTitle(campaign?.title ?? '');
    setDescription(campaign?.description ?? '');
    setStatus(campaign?.status ?? 'Rascunho');
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
  }

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    titleInputRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDialogOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)',
      );
      const firstElement = focusableElements.item(0);
      const lastElement = focusableElements.item(focusableElements.length - 1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const focusIsOutside = !dialogRef.current.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === firstElement || focusIsOutside)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || focusIsOutside)) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      previouslyFocused?.focus();
    };
  }, [isDialogOpen]);

  function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        <Button type="button" onClick={() => openDialog()}>
          <Plus size={17} aria-hidden="true" /> Nova campanha
        </Button>
      </div>
      <Card className="panel campaigns" aria-live="polite">
        {campaigns.map((campaign) => (
          <div className="campaign-row" key={campaign.id}>
            <div className="campaign-symbol">
              <Megaphone size={20} aria-hidden="true" />
            </div>
            <div className="campaign-info">
              <strong>{campaign.title}</strong>
              <small>{campaign.description || 'Sem descrição'}</small>
            </div>
            <Badge
              variant={
                campaign.status === 'Ativa'
                  ? 'success'
                  : campaign.status === 'Encerrada'
                    ? 'warning'
                    : 'neutral'
              }
            >
              {campaign.status}
            </Badge>
            <Button
              className="iconbtn"
              type="button"
              variant="secondary"
              onClick={() => openDialog(campaign)}
              aria-label={`Editar ${campaign.title}`}
            >
              Editar
            </Button>
            <Button
              className="iconbtn"
              type="button"
              variant="danger"
              onClick={() => deleteCampaign(campaign.id)}
              aria-label={`Excluir ${campaign.title}`}
            >
              <Trash2 size={17} aria-hidden="true" />
            </Button>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p role="status">Nenhuma campanha cadastrada. Crie a primeira!</p>
        )}
      </Card>
      {isDialogOpen && (
        <div
          className="modal-back"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            className="modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-title"
            aria-describedby="campaign-dialog-help"
          >
            <form onSubmit={saveCampaign}>
              <div className="modal-head">
                <h2 id="campaign-title">
                  {editingId !== null ? 'Editar campanha' : 'Nova campanha'}
                </h2>
                <Button
                  className="iconbtn"
                  type="button"
                  variant="secondary"
                  onClick={closeDialog}
                  aria-label="Fechar"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
              <label htmlFor="campaign-name">
                Nome da campanha
                <input
                  id="campaign-name"
                  ref={titleInputRef}
                  value={title}
                  maxLength={80}
                  required
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Semana de vantagens"
                />
              </label>
              <label htmlFor="campaign-description">
                Descrição
                <textarea
                  id="campaign-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Descreva o benefício e as condições"
                  rows={3}
                />
              </label>
              <label htmlFor="campaign-status">
                Situação
                <select
                  id="campaign-status"
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
                <Button variant="subtle" type="button" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!title.trim()}>
                  Salvar campanha
                </Button>
              </div>
              <p className="smallprint" id="campaign-dialog-help">
                As alterações existem apenas nesta sessão. Recarregar restaura os dados iniciais.
              </p>
            </form>
          </div>
        </div>
      )}
    </DemoShell>
  );
}
