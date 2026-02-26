import { CrossCircledIcon } from "@radix-ui/react-icons"
import * as Tooltip from "@radix-ui/react-tooltip"
import { Card, Flex, Badge, Spinner, Inset, Text } from "@radix-ui/themes"
import { useState } from "react"
import { Generation } from "../lib/schema/api"

export const ImageErrorTile: React.FC<{ message: string; tooltip?: string }> = ({
  message,
  tooltip,
}) => {
  const badge = (
    <Badge color="red" size="2">
      {message}
    </Badge>
  )

  return (
    <Card>
      <Flex
        align="center"
        justify="center"
        style={{ aspectRatio: "1 / 1", minHeight: 180 }}
        direction="column"
        gap="2"
      >
        <CrossCircledIcon width={22} height={22} color="var(--red-9)" />
        {tooltip ? (
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  aria-label={message}
                  style={{ all: "unset", display: "inline-flex", cursor: "help" }}
                >
                  {badge}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  sideOffset={5}
                  style={{
                    maxWidth: 320,
                    backgroundColor: "var(--gray-12)",
                    color: "var(--gray-1)",
                    borderRadius: "var(--radius-2)",
                    padding: "6px 10px",
                    fontSize: 12,
                    lineHeight: "16px",
                    boxShadow:
                      "0px 10px 38px -10px rgba(22,23,24,0.35), 0px 10px 20px -15px rgba(22,23,24,0.2)",
                    zIndex: 20,
                  }}
                >
                  {tooltip}
                  <Tooltip.Arrow style={{ fill: "var(--gray-12)" }} />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ) : (
          badge
        )}
      </Flex>
    </Card>
  )
}

export const ImageTile: React.FC<{ generation: Generation }> = ({ generation: item }) => {
  const [hasImageError, setHasImageError] = useState(false)
  const generationErrorReason = item.error?.trim() || "No failure reason provided."

  if (item.status === "PENDING") {
    return (
      <Card>
        <Flex
          align="center"
          justify="center"
          style={{ aspectRatio: "1 / 1", minHeight: 180 }}
          gap="2"
          direction="column"
        >
          <Spinner size="3" />
          <Text size="1" color="gray">
            Generating…
          </Text>
        </Flex>
      </Card>
    )
  }

  if (item.status === "ERROR") {
    return <ImageErrorTile message="Generation failed" tooltip={generationErrorReason} />
  }

  if (item.status === "SUCCESS") {
    if (hasImageError) {
      return <ImageErrorTile message="Image failed to load" />
    }

    return (
      <Card size="1" style={{ overflow: "hidden" }}>
        <Inset>
          <img
            src={item.result}
            alt="Generated image"
            style={{ display: "block", width: "100%", objectFit: "cover" }}
            onError={() => setHasImageError(true)}
          />
        </Inset>
      </Card>
    )
  }

  return null
}
