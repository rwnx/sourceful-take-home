import { CrossCircledIcon } from "@radix-ui/react-icons"
import { Card, Flex, Badge, Spinner, Inset, Text } from "@radix-ui/themes"
import { useState } from "react"
import { Generation } from "../lib/schema/api"

export const ImageErrorTile: React.FC<{ message: string }> = ({ message }) => (
  <Card>
    <Flex
      align="center"
      justify="center"
      style={{ aspectRatio: "1 / 1", minHeight: 180 }}
      direction="column"
      gap="2"
    >
      <CrossCircledIcon width={22} height={22} color="var(--red-9)" />
      <Badge color="red" size="2">
        {message}
      </Badge>
    </Flex>
  </Card>
)

export const ImageTile: React.FC<{ generation: Generation }> = ({ generation: item }) => {
  const [hasImageError, setHasImageError] = useState(false)

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
    return <ImageErrorTile message="Generation failed" />
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
