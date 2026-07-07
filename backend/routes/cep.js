import { Router } from 'express';

const router = Router();

router.get('/:cep', async (req, res) => {
  const cep = req.params.cep.replace(/\D/g, '');

  if (cep.length !== 8) {
    return res.status(400).json({ error: 'CEP inválido' });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado' });
    }

    res.json({
      cep: data.cep,
      street: data.logradouro,
      complement: data.complemento,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    });
  } catch {
    res.status(502).json({ error: 'Erro ao consultar CEP' });
  }
});

export default router;
