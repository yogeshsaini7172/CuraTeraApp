import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Modal,
  Image,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { INITIAL_DOCUMENTS, SCHEMES } from '../data/schemesData';
import { DocumentItem } from '../types';
import { DemoUser } from '../data/demoUsers';
import { SupportedLanguage } from '../i18n/translations';

// Premium GovTech Theme: Official Trust Blue & Radiant Saffron Orange
const THEME = {
  blueDark: '#0A2540',
  blueNavy: '#0F2942',
  bluePrimary: '#1565C0',
  blueSoft: '#1E40AF',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  blueCardBg: '#F8FAFC',
  orangePrimary: '#EA580C',
  orangeLight: '#FFF7ED',
  orangeBorder: '#FED7AA',
  canvas: '#F1F5F9',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  textMuted: '#64748B',
  textDark: '#0F172A',
  greenVerified: '#16A34A',
  greenLight: '#DCFCE7',
  greenBorder: '#86EFAC',
};

interface DocumentsScreenProps {
  currentLanguage?: SupportedLanguage;
  onNavigateToSchemes?: (schemeId?: string) => void;
  activeDemoUser?: DemoUser;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({
  currentLanguage = 'hi',
  onNavigateToSchemes,
  activeDemoUser,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [filterType, setFilterType] = useState<'all' | 'saved' | 'pending'>('all');

  // Modals
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [uploadTargetDoc, setUploadTargetDoc] = useState<DocumentItem | null>(null);
  const [isAddCustomVisible, setIsAddCustomVisible] = useState(false);
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [customDocNumber, setCustomDocNumber] = useState('');

  const isEn = currentLanguage === 'en';

  // Calculations
  const savedDocs = documents.filter((d) => d.isAvailable);
  const pendingDocs = documents.filter((d) => !d.isAvailable);
  const totalCount = documents.length;
  const savedCount = savedDocs.length;
  const progressPercent = totalCount > 0 ? Math.round((savedCount / totalCount) * 100) : 0;

  // Unlocked Schemes based on stored documents
  const unlockedSchemeIds = Array.from(
    new Set(savedDocs.flatMap((d) => d.unlockedSchemeIds || []))
  );
  const unlockedSchemesList = SCHEMES.filter((s) => unlockedSchemeIds.includes(s.id));

  // Filtered documents
  const displayedDocs = documents.filter((d) => {
    if (filterType === 'saved') return d.isAvailable;
    if (filterType === 'pending') return !d.isAvailable;
    return true;
  });

  // Toggle document availability
  const handleToggleDoc = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, isAvailable: !doc.isAvailable } : doc
      )
    );
  };

  // Image Picking - Gallery
  const handlePickFromGallery = async (targetDoc: DocumentItem) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          isEn ? 'Permission Required' : 'अनुमति आवश्यक',
          isEn
            ? 'Please allow photo gallery access to upload documents.'
            : 'कागजात अपलोड करने के लिए कृपया गैलरी की अनुमति दें।'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        saveDocumentImage(targetDoc.id, result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(isEn ? 'Error' : 'त्रुटि', error.message || 'Could not pick image');
    }
  };

  // Image Picking - Camera
  const handlePickFromCamera = async (targetDoc: DocumentItem) => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            isEn ? 'Permission Required' : 'अनुमति आवश्यक',
            isEn
              ? 'Please allow camera access to take photo of your document.'
              : 'कागजात की फोटो खींचने के लिए कृपया कैमरा अनुमति दें।'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        saveDocumentImage(targetDoc.id, result.assets[0].uri);
      }
    } catch (error: any) {
      // Fallback on web/desktop if camera is not directly available
      try {
        const fallbackResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
        if (!fallbackResult.canceled && fallbackResult.assets && fallbackResult.assets.length > 0) {
          saveDocumentImage(targetDoc.id, fallbackResult.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert(isEn ? 'Error' : 'त्रुटि', error.message || 'Could not access camera or files');
      }
    }
  };

  // Load sample demo document
  const handleLoadSampleDoc = (targetDoc: DocumentItem) => {
    const demoSampleUrl =
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80';
    saveDocumentImage(targetDoc.id, demoSampleUrl);
  };

  const saveDocumentImage = (docId: string, uri: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              isAvailable: true,
              imageUri: uri,
              maskedNumber: doc.maskedNumber || (isEn ? 'Stored' : 'सुरक्षित'),
            }
          : doc
      )
    );
    // Instantly update open preview card so user immediately sees their clicked photo!
    setPreviewDoc((prev) =>
      prev && prev.id === docId
        ? {
            ...prev,
            isAvailable: true,
            imageUri: uri,
            maskedNumber: prev.maskedNumber || (isEn ? 'Stored' : 'सुरक्षित'),
          }
        : prev
    );
    setUploadTargetDoc(null);
  };

  // Add custom document
  const handleSaveCustomDoc = () => {
    if (!customDocTitle.trim()) {
      Alert.alert(
        isEn ? 'Title Required' : 'नाम आवश्यक',
        isEn ? 'Please enter document name' : 'कृपया कागज़ का नाम लिखें'
      );
      return;
    }

    const newDoc: DocumentItem = {
      id: `custom-${Date.now()}`,
      titleHi: customDocTitle.trim(),
      titleEn: customDocTitle.trim(),
      descriptionHi: 'नागरिक द्वारा जोड़ा गया दस्तावेज।',
      descriptionEn: 'Custom document added by citizen.',
      isAvailable: true,
      maskedNumber: customDocNumber.trim() || (isEn ? 'Stored' : 'सुरक्षित'),
      howToGetHi: 'नजदीकी जन सेवा केंद्र से प्राप्त करें।',
      howToGetEn: 'Obtain from nearest CSC Center.',
      docCategory: 'other',
    };

    setDocuments((prev) => [...prev, newDoc]);
    setCustomDocTitle('');
    setCustomDocNumber('');
    setIsAddCustomVisible(false);
  };

  // WhatsApp Sharing Entire Locker
  const handleShareToWhatsApp = async () => {
    const readyList = savedDocs
      .map((d) => `  ✓ *${isEn ? d.titleEn : d.titleHi}* (${d.maskedNumber || 'सुरक्षित'})`)
      .join('\n');

    const pendingList = pendingDocs
      .map((d) => `  ⚠️ *${isEn ? d.titleEn : d.titleHi}* (बाकी है)`)
      .join('\n');

    const shareMessage = isEn
      ? `🏛️ *DigiLocker - YojnaMitra*\n` +
        `👤 *Citizen:* ${activeDemoUser?.name || 'Citizen'}\n` +
        `📊 *Status:* ${savedCount}/${totalCount} Verified Cards (${progressPercent}%)\n\n` +
        `📁 *Stored Govt IDs:*\n${readyList}\n\n` +
        (pendingList ? `⏳ *Pending Slots:*\n${pendingList}\n\n` : '') +
        `🔒 *100% Secure On-Device GovTech Locker*`
      : `🏛️ *डिजिटल कागजात लॉकर - योजना मित्र*\n` +
        `👤 *नागरिक:* ${activeDemoUser?.name || 'नागरिक'}\n` +
        `📊 *स्थिति:* ${savedCount}/${totalCount} आईडी कार्ड सुरक्षित (${progressPercent}%)\n\n` +
        `📁 *सुरक्षित सरकारी कागजात:*\n${readyList}\n\n` +
        (pendingList ? `⏳ *खाली स्लॉट:*\n${pendingList}\n\n` : '') +
        `🔒 *100% सुरक्षित ऑन-डिवाइस लॉकर*`;

    try {
      await Share.share({
        message: shareMessage,
        title: isEn ? 'Digital Locker' : 'डिजिटल लॉकर',
      });
    } catch (error: any) {
      Alert.alert(isEn ? 'Error' : 'त्रुटि', error.message);
    }
  };



  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. FILTER PILLS: All / Ready / Pending */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'all' && styles.filterPillBlueActive]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'all' && styles.filterPillTextActive,
              ]}
            >
              {isEn ? 'All' : 'सभी'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'saved' && styles.filterPillBlueActive]}
            onPress={() => setFilterType('saved')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'saved' && styles.filterPillTextActive,
              ]}
            >
              {isEn ? 'Verified' : 'सत्यापित'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'pending' && styles.filterPillOrangeActive]}
            onPress={() => setFilterType('pending')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'pending' && styles.filterPillTextActive,
              ]}
            >
              {isEn ? 'Missing' : 'बाकी'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. REAL DIGILOCKER ID CARDS & EMPTY SLOTS (CLEAN UNCLUTTERED) */}
        {displayedDocs.map((doc) => {
          const title = isEn ? doc.titleEn : doc.titleHi;
          const isReady = doc.isAvailable;

          // ==========================================
          // CASE A: REAL DIGILOCKER ID CARD (STORED)
          // ==========================================
          if (isReady) {
            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.idCard}
                onPress={() => setPreviewDoc(doc)}
                activeOpacity={0.8}
              >
                {/* ID Card Top Gov Strip */}
                <View style={styles.idCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.idCardGovText}>
                      {isEn ? 'GOVERNMENT OF INDIA' : 'भारत सरकार • डिजी लॉकर'}
                    </Text>
                    <Text style={styles.idCardName} numberOfLines={1}>
                      {title}
                    </Text>
                  </View>

                  <View style={styles.verifiedChip}>
                    <Text style={styles.verifiedChipText}>
                      {isEn ? 'VERIFIED' : 'सत्यापित'}
                    </Text>
                  </View>
                </View>

                {/* ID Card Body */}
                <View style={styles.idCardBody}>
                  <View style={styles.idDataRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.idDataLabel}>{isEn ? 'CITIZEN NAME' : 'नागरिक का नाम'}</Text>
                      <Text style={styles.idCitizenText} numberOfLines={1}>
                        {activeDemoUser?.name || 'Ramesh Kumar'}
                      </Text>
                      <Text style={[styles.idDataLabel, { marginTop: 6 }]}>
                        {isEn ? 'DOCUMENT NO.' : 'प्रमाण पत्र क्रमांक'}
                      </Text>
                      <Text style={styles.idCardNumber}>
                        {doc.maskedNumber || '•••• •••• 9241'}
                      </Text>
                    </View>

                    {/* Thumbnail of Uploaded Document Photo */}
                    {doc.imageUri ? (
                      <View style={styles.idCardThumbBox}>
                        <Image
                          source={{ uri: doc.imageUri }}
                          style={styles.idCardThumbImg}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View style={styles.idCardDocTypeBadge}>
                        <Text style={styles.idCardDocTypeText}>
                          {doc.docCategory ? doc.docCategory.toUpperCase() : 'GOV-ID'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Clean Tap to View Footer */}
                <View style={styles.idCardFooter}>
                  <Text style={styles.idCardFooterText}>
                    {isEn ? 'Tap to view card details' : 'कार्ड देखने के लिए टैप करें'}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            );
          }

          // ==========================================
          // CASE B: EMPTY LOCKER SLOT (PENDING)
          // ==========================================
          return (
            <View key={doc.id} style={styles.emptySlotCard}>
              <View style={styles.emptySlotHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptySlotTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.emptySlotSub}>
                    {isEn
                      ? 'Upload to locker to secure and unlock welfare benefits.'
                      : 'योजनाओं का पूरा लाभ लेने के लिए इसे लॉकर में रखें।'}
                  </Text>
                </View>

                <View style={styles.emptyMissingTag}>
                  <Text style={styles.emptyMissingTagText}>
                    {isEn ? 'Missing' : 'खाली स्लॉट'}
                  </Text>
                </View>
              </View>

              {/* Upload Action Button */}
              <TouchableOpacity
                style={styles.emptySlotBtn}
                onPress={() => setUploadTargetDoc(doc)}
                activeOpacity={0.85}
              >
                <Text style={styles.emptySlotBtnText}>
                  {isEn ? '+ Upload Document to Locker' : '+ लॉकर में सुरक्षित करें'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* 4. ADD OTHER DOCUMENT BUTTON */}
        <TouchableOpacity
          style={styles.addOtherCard}
          onPress={() => setIsAddCustomVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addOtherText}>
            {isEn ? '+ Add Another Certificate / Document' : '+ अन्य सरकारी कागज़ या प्रमाण पत्र जोड़ें'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: FULL SCREEN DIGILOCKER CARD PREVIEW */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* MODAL 1: FULL SCREEN GALLERY PHOTO VIEWER (ZERO CLUTTER) */}
      {/* ========================================================= */}
      <Modal
        visible={previewDoc !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View style={styles.galleryContainer}>
          {/* 1. TOP GALLERY HEADER: Title on Left, Close on Top-Right */}
          <View style={styles.galleryTopBar}>
            <View style={styles.galleryTitleGroup}>
              <Text style={styles.galleryTitleText} numberOfLines={1}>
                {previewDoc ? (isEn ? previewDoc.titleEn : previewDoc.titleHi) : ''}
              </Text>
              {previewDoc?.maskedNumber && (
                <Text style={styles.gallerySubText}>
                  {previewDoc.maskedNumber}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setPreviewDoc(null)}
              style={styles.galleryCloseBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 2. FULL SCREEN PHOTO DISPLAY (CLEAN GALLERY STYLE) */}
          <View style={styles.galleryBody}>
            {previewDoc?.imageUri ? (
              <Image
                source={{ uri: previewDoc.imageUri }}
                style={styles.galleryFullPhoto}
                resizeMode="contain"
              />
            ) : (
              /* When photo is missing, show clean direct upload prompt */
              <View style={styles.galleryEmptyBox}>
                <View style={styles.galleryEmptyIconCircle}>
                  <Ionicons name="image-outline" size={44} color="#94A3B8" />
                </View>
                <Text style={styles.galleryEmptyTitle}>
                  {isEn ? 'No Document Photo Uploaded' : 'कोई फोटो अपलोड नहीं है'}
                </Text>
                <Text style={styles.galleryEmptyDesc}>
                  {isEn
                    ? 'Take a photo of your certificate with camera or pick from gallery'
                    : 'अपने असली कागज़ की फोटो कैमरे से खींचें या गैलरी से अपलोड करें'}
                </Text>

                <View style={styles.galleryEmptyActionRow}>
                  <TouchableOpacity
                    style={styles.galleryCameraActionBtn}
                    onPress={() => previewDoc && handlePickFromCamera(previewDoc)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.galleryCameraActionText}>
                      {isEn ? 'Take Photo' : 'कैमरे से फोटो लें'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.galleryGalleryActionBtn}
                    onPress={() => previewDoc && handlePickFromGallery(previewDoc)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="images-outline" size={18} color={THEME.bluePrimary} />
                    <Text style={styles.galleryGalleryActionText}>
                      {isEn ? 'From Gallery' : 'गैलरी से चुनें'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* 3. BOTTOM GALLERY TOOLBAR: UPDATE & SHARE */}
          <View style={styles.galleryBottomBar}>
            <TouchableOpacity
              style={styles.galleryUpdateBtn}
              onPress={() => previewDoc && setUploadTargetDoc(previewDoc)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={19} color="#FFFFFF" />
              <Text style={styles.galleryUpdateBtnText}>
                {isEn ? 'Update' : 'अपडेट'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.galleryShareBtn}
              onPress={() => {
                if (previewDoc) {
                  const title = isEn ? previewDoc.titleEn : previewDoc.titleHi;
                  Share.share({
                    message: `🏛️ *${title}*\n👤 *नागरिक:* ${activeDemoUser?.name || 'नागरिक'}\n🔢 *क्रमांक:* ${previewDoc.maskedNumber || 'सुरक्षित'}\n🔒 *योजना मित्र लॉकर प्रमाणित प्रति*`,
                  });
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={19} color="#FFFFFF" />
              <Text style={styles.galleryShareBtnText}>
                {isEn ? 'Share' : 'शेयर'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: UPLOAD ACTION SHEET */}
      {/* ========================================================= */}
      <Modal
        visible={uploadTargetDoc !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadTargetDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {uploadTargetDoc
                  ? isEn
                    ? `Upload ${uploadTargetDoc.titleEn}`
                    : `${uploadTargetDoc.titleHi} अपलोड करें`
                  : ''}
              </Text>
              <TouchableOpacity
                onPress={() => setUploadTargetDoc(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={THEME.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Camera Option */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => uploadTargetDoc && handlePickFromCamera(uploadTargetDoc)}
              activeOpacity={0.7}
            >
              <View style={styles.sheetIconBox}>
                <Ionicons name="camera-outline" size={20} color={THEME.bluePrimary} />
              </View>
              <Text style={styles.sheetOptionText}>
                {isEn ? 'Take Photo with Camera' : 'कैमरे से फोटो खींचें'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Gallery Option */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => uploadTargetDoc && handlePickFromGallery(uploadTargetDoc)}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetIconBox, { backgroundColor: THEME.orangeLight, borderColor: THEME.orangeBorder }]}>
                <Ionicons name="images-outline" size={20} color={THEME.orangePrimary} />
              </View>
              <Text style={styles.sheetOptionText}>
                {isEn ? 'Choose from Photo Gallery' : 'गैलरी से फोटो चुनें'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Demo Sample Option */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => uploadTargetDoc && handleLoadSampleDoc(uploadTargetDoc)}
              activeOpacity={0.7}
            >
              <View style={styles.sheetIconBox}>
                <Ionicons name="document-attach-outline" size={20} color={THEME.bluePrimary} />
              </View>
              <Text style={styles.sheetOptionText}>
                {isEn ? 'Add Sample Demo Document' : 'सैंपल डेमो कागज़ जोड़ें'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: ADD CUSTOM DOCUMENT */}
      {/* ========================================================= */}
      <Modal
        visible={isAddCustomVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddCustomVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModal}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {isEn ? 'Add Document' : 'नया कागज़ जोड़ें'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddCustomVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={THEME.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{isEn ? 'Document Name' : 'कागज़ का नाम'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={isEn ? 'e.g. Caste Certificate' : 'जैसे: जाति प्रमाण पत्र'}
              placeholderTextColor="#94A3B8"
              value={customDocTitle}
              onChangeText={setCustomDocTitle}
            />

            <Text style={styles.inputLabel}>{isEn ? 'ID Number (Optional)' : 'प्रमाण पत्र क्रमांक (वैकल्पिक)'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={isEn ? 'e.g. 123456789' : 'जैसे: 123456789'}
              placeholderTextColor="#94A3B8"
              value={customDocNumber}
              onChangeText={setCustomDocNumber}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveCustomDoc}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{isEn ? 'Save to Locker' : 'लॉकर में सुरक्षित करें'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90,
  },

  // ==========================================
  // 1. DIGILOCKER VAULT HEADER CARD
  // ==========================================
  vaultHeaderCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 0,
  },
  vaultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  vaultEmblemBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  vaultTitleCol: {
    flex: 1,
  },
  vaultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.bluePrimary,
    letterSpacing: 0.6,
  },
  vaultCitizenName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.blueDark,
    marginTop: 1,
  },
  vaultShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: THEME.blueLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.blueBorder,
    elevation: 0,
  },
  vaultShareText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.bluePrimary,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  meterValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.blueDark,
  },
  meterPercent: {
    color: THEME.orangePrimary,
    fontWeight: '800',
  },
  meterTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: THEME.orangePrimary,
    borderRadius: 4,
  },
  unlockedRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.blueLight,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.blueBorder,
    elevation: 0,
  },
  unlockedRibbonLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockedRibbonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.blueDark,
  },
  unlockedArrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  unlockedArrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.bluePrimary,
  },

  // ==========================================
  // 2. FILTER PILLS
  // ==========================================
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 0,
  },
  filterPillBlueActive: {
    backgroundColor: THEME.bluePrimary,
    borderColor: THEME.bluePrimary,
  },
  filterPillOrangeActive: {
    backgroundColor: THEME.orangePrimary,
    borderColor: THEME.orangePrimary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ==========================================
  // 3. REAL DIGILOCKER ID CARD (STORED)
  // ==========================================
  idCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    elevation: 0, // STRICTLY ZERO SHADOW
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  idCardTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  idEmblemBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  idCardGovText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.bluePrimary,
    letterSpacing: 0.5,
  },
  idCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.blueDark,
    marginTop: 1,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.4,
  },
  idCardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  chipAndCatRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 6,
  },
  idDocCatText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  idDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idDataLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  idCitizenText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDark,
  },
  idCardNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.blueDark,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.8,
  },
  idCardThumbBox: {
    width: 62,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    marginLeft: 12,
  },
  idCardThumbImg: {
    width: '100%',
    height: '100%',
  },
  idCardThumbOverlay: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(10, 37, 64, 0.75)',
    borderRadius: 4,
    padding: 2,
  },
  idCardNoThumbBox: {
    width: 62,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.blueBorder,
    borderStyle: 'dashed',
    backgroundColor: THEME.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  idCardNoThumbText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.bluePrimary,
    marginTop: 2,
  },
  idCardDocTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idCardDocTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  idCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  idCardFooterText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: THEME.bluePrimary,
  },

  // ==========================================
  // EMPTY LOCKER SLOT (PENDING)
  // ==========================================
  emptySlotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    elevation: 0,
  },
  emptySlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  emptySlotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textDark,
  },
  emptyMissingTag: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  emptyMissingTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.orangePrimary,
  },
  emptySlotSub: {
    fontSize: 11.5,
    color: THEME.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  emptySlotBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.orangePrimary,
    paddingVertical: 10,
    borderRadius: 9,
    elevation: 0,
  },
  emptySlotBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ==========================================
  // 4. ADD OTHER DOCUMENT
  // ==========================================
  addOtherCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 24,
    elevation: 0,
  },
  addOtherText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.bluePrimary,
  },

  // ==========================================
  // MODALS
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.blueDark,
  },
  closeBtn: {
    padding: 4,
  },

  // Fullscreen Gallery Viewer
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  galleryTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 48,
    paddingBottom: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 10,
  },
  galleryCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryTitleGroup: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  galleryTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gallerySubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  galleryBody: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050508',
  },
  galleryFullPhoto: {
    width: '100%',
    height: '100%',
  },
  galleryEmptyBox: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  galleryEmptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  galleryEmptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  galleryEmptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  galleryEmptyActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryCameraActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.orangePrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  galleryCameraActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  galleryGalleryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  galleryGalleryActionText: {
    color: THEME.bluePrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  galleryBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'web' ? 16 : 28,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    zIndex: 10,
  },
  galleryUpdateBtn: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.bluePrimary,
    borderRadius: 12,
    elevation: 0,
  },
  galleryUpdateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  galleryShareBtn: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.orangePrimary,
    borderRadius: 12,
    elevation: 0,
  },
  galleryShareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Action Sheet
  actionSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    elevation: 0,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 8,
    elevation: 0,
  },
  sheetIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.blueLight,
    borderWidth: 1,
    borderColor: THEME.blueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
  sheetOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textDark,
  },

  // Custom Modal
  customModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    elevation: 0,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: THEME.textDark,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: THEME.orangePrimary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
