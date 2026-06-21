import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    formEmbed: {
      insertFormEmbed: (attrs: { formId: string; portalId: string }) => ReturnType;
    };
  }
}

export const FormEmbed = Node.create({
  name: 'formEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      formId:   { default: '' },
      portalId: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-form-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({
        class:            'hs-form-embed',
        'data-form-id':   HTMLAttributes.formId,
        'data-portal-id': HTMLAttributes.portalId,
      }),
    ];
  },

  addNodeView() {
    return (props: import('@tiptap/core').NodeViewRendererProps) => {
      const { node, getPos, editor } = props;
      const dom = document.createElement('div');
      dom.className = 'rte-form-embed-node';
      dom.contentEditable = 'false';
      dom.style.cssText = [
        'display:flex', 'align-items:center', 'gap:10px',
        'padding:12px 16px', 'margin:12px 0',
        'background:#eff6ff', 'border:2px dashed #93c5fd',
        'border-radius:8px', 'cursor:default', 'user-select:none',
      ].join(';');

      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.style.cssText = 'font-size:20px;color:#3b82f6;flex-shrink:0';
      icon.textContent = 'dynamic_form';

      const label = document.createElement('div');
      label.style.cssText = 'flex:1;font-size:13px;color:#1e40af';
      label.innerHTML = `<strong style="display:block;font-weight:700">HubSpot Form Embed</strong>
        <span style="font-size:11px;color:#3b82f6;font-family:monospace">
          Form ID: ${node.attrs.formId || '—'} &nbsp;·&nbsp; Portal: ${node.attrs.portalId || '—'}
        </span>`;

      const del = document.createElement('button');
      del.type = 'button';
      del.style.cssText = 'padding:4px 10px;font-size:11px;font-weight:700;border-radius:6px;border:1px solid #fca5a5;background:#fee2e2;color:#dc2626;cursor:pointer;flex-shrink:0';
      del.textContent = 'Remove';
      del.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (typeof getPos === 'function') {
          const pos = getPos() ?? 0;
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
        }
      });

      dom.appendChild(icon);
      dom.appendChild(label);
      dom.appendChild(del);

      return { dom };
    };
  },

  addCommands() {
    return {
      insertFormEmbed: (attrs) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs }),
    };
  },
});
