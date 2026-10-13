import { Link } from "expo-router"
import { View, Text } from "react-native"
export default function NotFound() { return <View style={{ flex: 1, justifyContent: "center", padding: 30, gap: 20 }}><Text style={{ fontSize: 25 }}>Let’s return to your space.</Text><Link href="/">Open Anew</Link></View> }
