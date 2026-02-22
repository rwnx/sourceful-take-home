"use client"
import { Button, Dialog, Flex, Text } from "@radix-ui/themes"
import { useSlashID, LoggedOut, LoggedIn } from "@slashid/react"
import { Form } from "@slashid/react"
import { useQuery } from "@tanstack/react-query"
import { SLASHID_COOKIE } from "../lib/utils"

function Auth() {
  const { user, logOut } = useSlashID()

  const fullLogOut = () => {
    cookieStore.delete(SLASHID_COOKIE)
    logOut();
  }

  const getEmailHandle = useQuery({
    queryKey: ["getEmailHandle"],
    queryFn: async () => {
      const handles = await user?.getHandles()
      if (!handles) return null
      return handles.find((x) => x.type === "email_address")?.value ?? null
    },
    enabled: !!user,
  })

  return (
    <>
      <LoggedOut>
        <Dialog.Root open>
          <Dialog.Content
            maxWidth="620px"
            // Prevent closing on outside click or Escape
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <Dialog.Title mb="1">Sign in to ImageGen</Dialog.Title>
            <Dialog.Description size="2" color="gray" mb="4">
              Enter your email to get started.
            </Dialog.Description>
            <Form />
          </Dialog.Content>
        </Dialog.Root>
      </LoggedOut>

      <LoggedIn>
        <Flex align="center" gap="3">
          <Text size="2" color="gray">
            {getEmailHandle.data}
          </Text>
          <Button variant="soft" color="gray" onClick={fullLogOut}>
            Log out
          </Button>
        </Flex>
      </LoggedIn>
    </>
  )
}

export default Auth