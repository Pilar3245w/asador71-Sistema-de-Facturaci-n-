// Pequeña ayuda: abre o cierra un <dialog> según un valor verdadero/falso.
import { watch } from "vue";

export function useDialogo(abierto, dialogo) {
  watch(abierto, valor => {
    const d = dialogo.value;
    if (!d) return;
    if (valor) { if (!d.open) d.showModal(); }
    else if (d.open) d.close();
  });
}
