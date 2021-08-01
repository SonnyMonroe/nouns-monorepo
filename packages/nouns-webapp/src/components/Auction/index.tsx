import { Col } from 'react-bootstrap';
import { StandaloneNounWithSeed } from '../StandaloneNoun';
import AuctionActivity from '../AuctionActivity';
import { Row, Container } from 'react-bootstrap';
import Noun from '../Noun';
import { Auction as IAuction } from '../../wrappers/nounsAuction';
import classes from './Auction.module.css';
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { auctionQuery } from '../../wrappers/subgraph';
import { BigNumber } from 'ethers';
import { INounSeed } from '../../wrappers/nounToken';
import NounderNounContent from '../NounderNounContent';

const isNounderNoun = (nounId: BigNumber) => {
  return nounId.mod(10).eq(0);
};

const createAuctionObj = (data: any): IAuction => {
  const auction: IAuction = {
    amount: data.auction.amount,
    bidder: '',
    endTime: data.auction.endTime,
    startTime: data.auction.startTime,
    length: data.auction.endTime - data.auction.startTime,
    nounId: data.auction.id,
    settled: data.auction.settled,
  };
  return auction;
};

const Auction: React.FC<{ auction: IAuction; bgColorHandler: (useGrey: boolean) => void }> =
  props => {
    const { auction: currentAuction, bgColorHandler } = props;

    const [onDisplayNounId, setOnDisplayNounId] = useState(currentAuction && currentAuction.nounId);
    const [isLastAuction, setIsLastAuction] = useState(true);
    const [isFirstAuction, setIsFirstAuction] = useState(false);

    const { loading: loadingCurrent, data: dataCurrent } = useQuery(
      auctionQuery(onDisplayNounId && onDisplayNounId.toNumber()),
    );
    const { data: dataNext } = useQuery(
      auctionQuery(onDisplayNounId && onDisplayNounId.add(1).toNumber()),
    );
    // Query prev auction to cache and allow for a smoother browsing ux
    useQuery(auctionQuery(onDisplayNounId && onDisplayNounId.sub(1).toNumber()));

    /**
     * Auction derived from `onDisplayNounId` query
     */
    const auction: IAuction = dataCurrent && dataCurrent.auction && createAuctionObj(dataCurrent);
    /**
     * Auction derived from `onDisplayNounId.add(1)` query
     */
    const nextAuction: IAuction = dataNext && dataNext.auction && createAuctionObj(dataNext);

    const loadedNounHandler = (seed: INounSeed) => {
      bgColorHandler(seed.background === 0);
    };

    useEffect(() => {
      if (!onDisplayNounId) {
        setOnDisplayNounId(currentAuction && currentAuction.nounId);
      }
    }, [onDisplayNounId, currentAuction]);

    const auctionHandlerFactory = (nounIdMutator: (prev: BigNumber) => BigNumber) => () => {
      setOnDisplayNounId(prev => {
        const updatedNounId = nounIdMutator(prev);
        setIsFirstAuction(updatedNounId.eq(0) ? true : false);
        setIsLastAuction(updatedNounId.eq(currentAuction && currentAuction.nounId) ? true : false);
        return updatedNounId;
      });
    };

    const prevAuctionHandler = auctionHandlerFactory((prev: BigNumber) => prev.sub(1));
    const nextAuctionHandler = auctionHandlerFactory((prev: BigNumber) => prev.add(1));

    const nounContent = (
      <div className={classes.nounWrapper}>
        <StandaloneNounWithSeed nounId={onDisplayNounId} onLoadSeed={loadedNounHandler} />
      </div>
    );

    const loadingNoun = (
      <div className={classes.nounWrapper}>
        <Noun imgPath="" alt="" />
      </div>
    );

    const auctionActivityContent = onDisplayNounId && currentAuction && auction && (
      <AuctionActivity
        auction={!loadingCurrent && isLastAuction ? currentAuction : auction}
        isFirstAuction={isFirstAuction}
        isLastAuction={isLastAuction}
        onPrevAuctionClick={prevAuctionHandler}
        onNextAuctionClick={nextAuctionHandler}
      />
    );

    const nounderNounContent = nextAuction && (
      <NounderNounContent
        mintTimestamp={nextAuction.startTime}
        nounId={onDisplayNounId}
        isFirstAuction={isFirstAuction}
        isLastAuction={isLastAuction}
        onPrevAuctionClick={prevAuctionHandler}
        onNextAuctionClick={nextAuctionHandler}
      />
    );

    return (
      <Container fluid="lg">
        <Row>
          <Col lg={{ span: 6 }} className={classes.nounContentCol}>
            {!loadingCurrent && onDisplayNounId ? nounContent : loadingNoun}
          </Col>
          <Col lg={{ span: 6 }} className={classes.auctionActivityCol}>
            {onDisplayNounId && isNounderNoun(onDisplayNounId)
              ? nounderNounContent
              : auctionActivityContent}
          </Col>
        </Row>
      </Container>
    );
  };

export default Auction;