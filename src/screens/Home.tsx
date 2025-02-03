import { Heading, HStack, Text, useToast, VStack } from '@gluestack-ui/themed'
import { HomeHeader } from '@components/HomeHeader'
import { Group } from '@components/Group'
import { ToastMessage } from '@components/ToastMessage'
import { ExerciseCard } from '../components/ExerciseCard'

import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { useState, useEffect, useCallback } from 'react'
import { FlatList } from 'react-native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ExerciseDTO } from '@dtos/ExerciseDTO'

export function Home() {
  const [exercises, setExercises] = useState<ExerciseDTO[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [groupSelected, setGroupSelected] = useState('costas')

  const toast = useToast()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleOpenExerciseDetails() {
    navigation.navigate('exercise')
  }

  async function fetchGroups() {
    try {
      const response = await api.get('/groups')
      setGroups(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar os grupos musculares'

      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <ToastMessage
            id={id}
            action="error"
            title={title}
            onClose={() => toast.close(id)}
          />
        ),
      })
    }
  }

  async function fecthExercisesByGroup() {
    try {
      const response = await api.get(`/exercises/bygroup/${groupSelected}`)
      setExercises(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar os exercícios'

      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <ToastMessage
            id={id}
            action="error"
            title={title}
            onClose={() => toast.close(id)}
          />
        ),
      })
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fecthExercisesByGroup()
    }, [groupSelected]),
  )

  return (
    <VStack flex={1}>
      <HomeHeader />

      <FlatList
        data={groups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Group
            name={item}
            isActive={groupSelected.toLowerCase() === item.toLowerCase()}
            onPress={() => setGroupSelected(item)}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 32 }}
        style={{ marginVertical: 40, maxHeight: 44, minHeight: 44 }}
      />

      <VStack px="$8" flex={1}>
        <HStack justifyContent="space-between" mb="$5" alignItems="center">
          <Heading color="$gray200" fontSize="$md">
            Exercícios
          </Heading>
          <Text color="$gray200" fontSize="$sm" fontFamily="$body">
            {exercises.length}
          </Text>
        </HStack>

        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard onPress={handleOpenExerciseDetails} data={item} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </VStack>
    </VStack>
  )
}
