/**
 * Divide uma mensagem do Discord em partes menores respeitando blocos de código
 * @param message A mensagem a ser dividida
 * @param maxLength O tamanho máximo de cada parte (padrão: 2000 caracteres)
 * @returns Um array contendo as partes da mensagem
 */
export function splitDiscordMessage(
  message: string,
  maxLength: number = 2000
): string[] {
  // Se a mensagem for menor que o limite, retorna ela diretamente
  if (message.length <= maxLength) {
    return [message]
  }

  const parts: string[] = []
  let currentPart = ''
  let inCodeBlock = false
  let currentBlockContent = ''

  // Função auxiliar para adicionar uma parte completa
  const addPart = () => {
    if (currentPart.trim().length > 0) {
      parts.push(currentPart)
      currentPart = ''
    }
  }

  // Divide a mensagem em linhas para facilitar o processamento
  const lines = message.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Verifica se a linha atual contém um delimitador de bloco de código
    if (line.includes('```')) {
      const segments = line.split('```')

      for (let j = 0; j < segments.length; j++) {
        const segment = segments[j]

        // Alterna o estado do bloco de código
        if (j > 0) {
          inCodeBlock = !inCodeBlock

          // Se estamos entrando em um bloco de código
          if (inCodeBlock) {
            currentBlockContent = '```' + segment
          }
          // Se estamos saindo de um bloco de código
          else {
            currentBlockContent += segment + '```'

            // Verifica se o bloco completo cabe na parte atual
            if (
              currentPart.length + currentBlockContent.length + 1 <=
              maxLength
            ) {
              currentPart += (currentPart ? '\n' : '') + currentBlockContent
            } else {
              // Se não couber, finalizamos a parte atual e começamos uma nova
              addPart()
              currentPart = currentBlockContent
            }

            currentBlockContent = ''
          }
        }
        // Se não estamos em um bloco de código, tratamos normalmente
        else if (!inCodeBlock) {
          if (currentPart.length + segment.length + 1 <= maxLength) {
            currentPart += (currentPart ? '\n' : '') + segment
          } else {
            addPart()
            currentPart = segment
          }
        }
      }
    }
    // Se estamos dentro de um bloco de código, adicionamos a linha ao conteúdo atual
    else if (inCodeBlock) {
      currentBlockContent += (currentBlockContent.length > 0 ? '\n' : '') + line
    }
    // Caso contrário, tratamos como texto normal
    else {
      // Verifica se a linha cabe na parte atual
      if (currentPart.length + line.length + 1 <= maxLength) {
        currentPart += (currentPart ? '\n' : '') + line
      } else {
        // Se a linha for maior que o limite, precisamos dividi-la
        if (line.length > maxLength) {
          // Adiciona o que temos atualmente
          if (currentPart.length > 0) {
            addPart()
          }

          // Divide a linha grande em pedaços
          let remainingLine = line
          while (remainingLine.length > 0) {
            const chunk = remainingLine.substring(0, maxLength)
            parts.push(chunk)
            remainingLine = remainingLine.substring(maxLength)
          }
        } else {
          // Adiciona a parte atual e começa uma nova com esta linha
          addPart()
          currentPart = line
        }
      }
    }
  }

  // Se ainda temos conteúdo de um bloco de código não finalizado
  if (currentBlockContent.length > 0) {
    if (currentPart.length + currentBlockContent.length + 1 <= maxLength) {
      currentPart += (currentPart ? '\n' : '') + currentBlockContent
    } else {
      addPart()
      currentPart = currentBlockContent
    }
  }

  // Adiciona a última parte se houver
  if (currentPart.length > 0) {
    addPart()
  }

  return parts
}
