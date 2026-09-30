import os
from pathlib import Path

def update_chatscreen():
    file_path = Path("c:/MY_PROJECTS/CuraTera/CuraTeraApp/src/screens/ChatScreen.tsx")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    target = """                      if (block.type === 'profile_confirmation') {"""

    replacement = """                      if (block.type === 'identity_verification') {
                        return (
                          <View key={`id-verify-${index}`} style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 }}>
                              🔐 {isEn ? 'Aadhaar Verification' : 'आधार सत्यापन'}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                              {isEn ? 'Before continuing, please verify your identity.' : 'आगे बढ़ने से पहले कृपया अपनी पहचान सत्यापित करें।'}
                            </Text>
                            
                            {block.data.name && <Text style={{ fontSize: 13, color: '#334155' }}><Text style={{ fontWeight: 'bold' }}>Name: </Text>{block.data.name}</Text>}
                            {block.data.age && <Text style={{ fontSize: 13, color: '#334155' }}><Text style={{ fontWeight: 'bold' }}>Age: </Text>{block.data.age}</Text>}
                            {block.data.state && <Text style={{ fontSize: 13, color: '#334155' }}><Text style={{ fontWeight: 'bold' }}>State: </Text>{block.data.state}</Text>}
                            {block.data.district && <Text style={{ fontSize: 13, color: '#334155', marginBottom: 8 }}><Text style={{ fontWeight: 'bold' }}>District: </Text>{block.data.district}</Text>}

                            {block.data.failed_fields && block.data.failed_fields.length > 0 && (
                              <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 8 }}>
                                ❌ {isEn ? 'Verification Failed. Please try again.' : 'सत्यापन विफल। कृपया पुनः प्रयास करें।'}
                              </Text>
                            )}
                            
                            <TextInput
                              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, padding: 8, marginVertical: 8, backgroundColor: '#FFF', color: '#0F172A' }}
                              placeholder={isEn ? 'Enter Demo Aadhaar ID' : 'आधार डेमो आईडी दर्ज करें'}
                              placeholderTextColor="#94A3B8"
                              onChangeText={(text) => {
                                block.data.aadhaarInput = text;
                              }}
                            />
                            
                            <TouchableOpacity
                              style={{ backgroundColor: '#0EA5E9', padding: 10, borderRadius: 4, alignItems: 'center', marginTop: 4 }}
                              onPress={async () => {
                                const aadhaarDemoId = block.data.aadhaarInput;
                                if (!aadhaarDemoId) return;
                                
                                setIsLoading(true);
                                try {
                                  // Call the verify API directly
                                  const response = await chatApi.verifyIdentity(aadhaarDemoId);
                                  
                                  const botResponse = {
                                    id: `bot-${Date.now()}`,
                                    sender: 'bot' as const,
                                    lang: currentLanguage,
                                    text: response.message,
                                    blocks: response.blocks,
                                  };
                                  
                                  setMessages(prev => [...prev, botResponse]);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                            >
                              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                                {isEn ? 'Verify Identity' : 'सत्यापित करें'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      }

                      if (block.type === 'profile_confirmation') {"""

    if "block.type === 'identity_verification'" not in content:
        content = content.replace(target, replacement)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated ChatScreen.tsx successfully")
    else:
        print("Already updated")

if __name__ == "__main__":
    update_chatscreen()
