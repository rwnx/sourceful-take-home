"use client"
import { StarIcon } from "@radix-ui/react-icons"
import { Heading, Separator, Flex, Select, Button, Text } from "@radix-ui/themes"
import { zodResolver } from "@hookform/resolvers/zod"
import { UseMutationResult } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import z from "zod"
import { AnimalSchema, Animals } from "@/app/lib/schema/api"

const FormSchema = z.object({
  numImages: z.coerce.number(),
  animal: AnimalSchema,
})

export type FormData = z.infer<typeof FormSchema>

type PromptFormProps = {
  mutation: UseMutationResult<unknown, unknown, FormData>
}

const MIN_IMAGES = 1
const MAX_IMAGES = 5

const PromptForm: React.FC<PromptFormProps> = ({ mutation }) => {
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      numImages: MIN_IMAGES,
      animal: Animals.Wolf,
    },
  })

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data)
  }

  const numImages = watch("numImages")
  const labelStyle = { color: "rgb(41, 41, 41)", fontSize: "13px" }

  return (
    <Flex
      asChild
      direction="column"
      gap="4"
      style={{ flex: 1, minHeight: 0 }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="1">
          <Heading size="4" weight="bold" trim="both">
            Generate
          </Heading>
          <Text size="2" color="gray">
            Configure your image generation
          </Text>
        </Flex>

        <Separator size="4" />

        <Flex direction="column" gap="1">
          <Flex align="center" justify="between">
            <Text as="label" weight="medium" htmlFor="num-images" style={labelStyle}>
              Number of Images
            </Text>
            <Controller
              name="numImages"
              control={control}
              render={({ field }) => (
                <Text size="2" weight="bold" style={{ color: "var(--brand-accent)" }}>
                  {field.value}
                </Text>
              )}
            />
          </Flex>
          <Controller
            name="numImages"
            control={control}
            render={({ field }) => (
              <input
                id="num-images"
                type="range"
                min={MIN_IMAGES}
                max={MAX_IMAGES}
                step={1}
                disabled={isSubmitting}
                value={field.value}
                onChange={(event) => field.onChange(Number(event.target.value))}
                style={{ width: "100%", accentColor: "var(--brand-accent)", cursor: "pointer" }}
              />
            )}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" weight="medium" htmlFor="animal" style={labelStyle}>
            Animal
          </Text>
          <Controller
            name="animal"
            control={control}
            render={({ field }) => (
              <Select.Root
                disabled={isSubmitting}
                value={field.value}
                onValueChange={field.onChange}
              >
                <Select.Trigger
                  id="animal"
                  placeholder="Select an Animal"
                  style={{ width: "100%" }}
                />
                <Select.Content>
                  <Select.Group>
                    <Select.Label>Animals</Select.Label>
                    {Object.entries(Animals).map(([label, id]) => (
                      <Select.Item key={id} value={id}>
                        {label}
                      </Select.Item>
                    ))}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            )}
          />
        </Flex>

        <Flex flexGrow="1" />

        <Button
          type="submit"
          style={{ width: "100%", cursor: "pointer" }}
          size="3"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          <Flex align="center" gap="2">
            <StarIcon width={14} height={14} aria-hidden />
            <Text>{`Generate ${numImages} images`}</Text>
          </Flex>
        </Button>
      </form>
    </Flex>
  )
}

export default PromptForm
