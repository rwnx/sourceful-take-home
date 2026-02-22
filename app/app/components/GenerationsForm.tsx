"use client"
import { Heading, Separator, Flex, Select, Button, Text, Grid } from "@radix-ui/themes"
import { zodResolver } from "@hookform/resolvers/zod"
import { UseMutationResult } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import z from "zod"
import { AnimalSchema, Animals } from "../api/generations/schema"

const FormSchema = z.object({
  numImages: z.coerce.number(),
  animal: AnimalSchema,
})

export type FormData = z.infer<typeof FormSchema>

type PromptFormProps = {
  mutation: UseMutationResult<unknown, unknown, FormData>
}

const PromptForm: React.FC<PromptFormProps> = ({ mutation }) => {
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      numImages: "1",
      animal: Animals.Wolf,
    },
  })

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data)
  }

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

        {/* Number of Images */}
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="num-images">
            Number of Images
          </Text>
          <Controller
            name="numImages"
            control={control}
            render={({ field }) => (
              <Select.Root
                disabled={isSubmitting}
                value={String(field.value)}
                onValueChange={field.onChange}
              >
                <Select.Trigger id="num-images" style={{ width: "100%" }} />
                <Select.Content>
                  {["1", "2", "3", "4", "5"].map((n) => (
                    <Select.Item key={n} value={n}>
                      {n}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          />
        </Flex>

        {/* Animal */}
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="animal">
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

        {/* Spacer pushes button to bottom */}
        <Flex flexGrow="1" />

        <Button
          type="submit"
          style={{ width: "100%", cursor: "pointer" }}
          size="3"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Generate
        </Button>
      </form>
    </Flex>
  )
}

export default PromptForm