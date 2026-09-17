#!/bin/bash
cd ~/mnt/Documents/Selo
echo "Aguardando arquivo..."
sleep 2
if [ -f /tmp/selo-files.tar.gz ]; then
  tar -xzf /tmp/selo-files.tar.gz
  echo "✅ Arquivos extraídos"
else
  echo "❌ Arquivo não encontrado"
fi
