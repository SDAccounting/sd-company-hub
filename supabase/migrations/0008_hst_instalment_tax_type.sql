-- Adds HST Instalments as its own tax account type, distinct from the
-- regular HST return — some clients make periodic advance HST payments
-- toward their annual liability, tracked separately from the filing itself.

alter type tax_type add value 'hst_instalment';
